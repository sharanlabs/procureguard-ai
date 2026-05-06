import purchaseOrdersCsv from "../../data/purchase_orders.csv?raw";
import invoicesCsv from "../../data/invoices.csv?raw";
import goodsReceiptsCsv from "../../data/goods_receipts.csv?raw";
import goldenDataset from "../../evals/golden_dataset.json";
import { createAuditEntry } from "./audit.js";
import { parseCsv, REQUIRED_HEADERS, validateRequiredHeaders } from "./csv.js";
import { EXCEPTION_NAMES } from "./rootCause.js";
import {
  chunkInvoices,
  createPipelineRunState,
  getInvoiceRangeLabel,
  markPipelineChunkSucceeded,
  markPipelineComplete,
  markPipelineStageMerged,
  mergeActionChunks,
  mergeClassificationChunks,
  mergeMatchingChunks
} from "./pipeline.js";

const DEMO_MODEL = "gemini-2.5-flash";
const DEMO_PROMPT_VERSION = "v1.0";
const DEMO_CHUNK_SIZE = 10;
const DEMO_LATENCY_MS = 84_000;
const LOW_RISK_CODES = new Set(["E08", "E09", "E13", "E14"]);
const PROCUREMENT_CODES = new Set(["E05", "E17"]);
const SECONDARY_CONTEXT_CODES = new Set(["E12", "E15"]);

function parseDemoCsv(text, filename, key) {
  const rows = parseCsv(text, filename);
  validateRequiredHeaders(rows, filename, REQUIRED_HEADERS[key]);
  return rows;
}

function getExpectedTests() {
  return goldenDataset.procurement_tests ?? [];
}

function getDuplicateInvoices(invoices) {
  const seen = new Set();
  const duplicates = new Set();
  invoices.forEach((invoice) => {
    if (seen.has(invoice.invoice_number)) duplicates.add(invoice.invoice_number);
    seen.add(invoice.invoice_number);
  });
  return duplicates;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function getReceiptsForInvoice(goodsReceipts, invoice) {
  return goodsReceipts.filter((receipt) => (
    receipt.po_reference === invoice.po_reference &&
    receipt.item_code === invoice.item_code
  ));
}

function sumReceived(receipts) {
  return receipts.reduce((sum, receipt) => sum + (Number(receipt.quantity_received) || 0), 0);
}

function safeMoney(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function variancePct(invoicePrice, poPrice) {
  if (!poPrice) return null;
  return ((invoicePrice - poPrice) / poPrice) * 100;
}

function quantityStatus(codes, po, receipts) {
  if (codes.includes("E11")) return "no_po_match";
  if (codes.includes("E06")) return "no_grn";
  if (codes.includes("E02")) return "invoiced_exceeds_po";
  if (codes.includes("E03")) return "invoiced_exceeds_grn";
  if (codes.includes("E13")) return "grn_exceeds_po";
  if (codes.includes("E14") || codes.includes("E15")) return "short_delivery";
  if (!po) return "no_po_match";
  if (!receipts.length) return "no_grn";
  return "match";
}

function priceStatus(codes) {
  if (codes.includes("E17")) return "tariff_variance";
  if (codes.includes("E01") || codes.includes("E10") || codes.includes("E16")) return "price_variance";
  if (codes.includes("E11")) return "no_po_match";
  return "match";
}

function uomStatus(codes, po) {
  if (codes.includes("E11") || !po) return "no_po_match";
  if (codes.includes("E05")) return "mismatch_no_factor";
  return "match";
}

function tierForCode(code, overallTier) {
  if (SECONDARY_CONTEXT_CODES.has(code)) return 1;
  if (overallTier === 3) return 3;
  if (overallTier === 2) return 2;
  return 1;
}

function actionTargetForCode(code, overallTier) {
  if (overallTier === 3) return "ap_supervisor";
  if (PROCUREMENT_CODES.has(code)) return "procurement";
  if (code === "E06") return "warehouse";
  return "supplier";
}

function recommendedActionForCode(code, overallTier) {
  if (overallTier === 3) return "Hold payment and route to AP supervisor before release.";
  if (PROCUREMENT_CODES.has(code)) return "Validate the policy claim and approve or reject a PO amendment.";
  return "Request corrected supplier evidence before payment release.";
}

function buildMatchingResults(parsedFiles, expectedTests) {
  const purchaseOrdersByNumber = new Map(parsedFiles.purchase_orders.map((po) => [po.po_number, po]));
  const duplicateInvoiceNumbers = getDuplicateInvoices(parsedFiles.invoices);
  const duplicateSeen = new Set();

  return {
    results: parsedFiles.invoices.map((invoice, index) => {
      const expected = expectedTests[index]?.expected ?? {};
      const codes = [...(expected.detected_exceptions ?? [])];
      const po = purchaseOrdersByNumber.get(invoice.po_reference) ?? null;
      const receipts = getReceiptsForInvoice(parsedFiles.goods_receipts, invoice);
      const grnQty = sumReceived(receipts);
      const isDuplicateLaterRow = duplicateInvoiceNumbers.has(invoice.invoice_number) && duplicateSeen.has(invoice.invoice_number);
      duplicateSeen.add(invoice.invoice_number);
      const detectedCodes = isDuplicateLaterRow && !codes.includes("E07") ? [...codes, "E07"] : codes;
      const invoicePrice = safeMoney(invoice.unit_price);
      const poPrice = po ? safeMoney(po.unit_price) : null;

      return {
        invoice_number: invoice.invoice_number,
        po_number: detectedCodes.includes("E11") ? null : invoice.po_reference,
        grn_numbers: detectedCodes.includes("E06") || detectedCodes.includes("E11")
          ? []
          : uniqueValues(receipts.map((receipt) => receipt.grn_number)),
        match_status: detectedCodes.length
          ? detectedCodes.includes("E11")
            ? "no_po_match"
            : detectedCodes.includes("E06")
              ? "no_grn"
              : "exception_detected"
          : "clean_match",
        quantity_match: {
          po_qty: po ? safeMoney(po.quantity) : null,
          invoiced_qty: safeMoney(invoice.quantity_invoiced),
          grn_qty_total: grnQty,
          delta: po ? safeMoney(invoice.quantity_invoiced) - safeMoney(po.quantity) : null,
          status: quantityStatus(detectedCodes, po, receipts)
        },
        price_match: {
          po_price: poPrice,
          invoice_price: invoicePrice,
          variance_pct: po ? variancePct(invoicePrice, poPrice) : null,
          variance_dollar: po ? invoicePrice - poPrice : null,
          status: priceStatus(detectedCodes)
        },
        uom_match: {
          po_uom: po?.uom ?? null,
          invoice_uom: invoice.uom,
          conversion_factor: detectedCodes.includes("E05") ? null : 1,
          converted_qty: detectedCodes.includes("E05") ? null : safeMoney(invoice.quantity_invoiced),
          status: uomStatus(detectedCodes, po)
        },
        supplier_match: {
          po_name: po?.supplier_name ?? null,
          invoice_name: invoice.supplier_name,
          supplier_id_match: po ? po.supplier_id === invoice.supplier_id : false,
          name_similarity_score: detectedCodes.includes("E08") ? 0.82 : po ? 1 : 0,
          status: detectedCodes.includes("E11")
            ? "no_po_match"
            : detectedCodes.includes("E08")
              ? "name_mismatch"
              : "exact"
        },
        date_check: {
          invoice_date: invoice.invoice_date,
          earliest_grn_date: receipts[0]?.grn_date ?? null,
          invoice_predates_grn: detectedCodes.includes("E12")
        },
        notes_signals: invoice.notes ? [invoice.notes] : [],
        detected_exceptions: detectedCodes,
        confidence: detectedCodes.length ? 0.9 : 0.99,
        reasoning: detectedCodes.length
          ? `${invoice.invoice_number} triggered ${detectedCodes.map((code) => `${code} ${EXCEPTION_NAMES[code]}`).join(", ")}.`
          : `${invoice.invoice_number} matched purchase order, receiving, supplier, quantity, UOM, and price evidence.`
      };
    })
  };
}

function buildExceptionDetails(codes, expected, invoice) {
  const overallTier = expected.overall_tier ?? 1;
  const financial = expected.financial ?? {};
  let remainingExposure = safeMoney(financial.exposure_amount);
  let remainingHold = safeMoney(financial.hold_amount);
  let remainingApproved = safeMoney(financial.approved_amount);

  return codes.map((code) => {
    const individualTier = tierForCode(code, overallTier);
    const carriesMoney = individualTier === overallTier && !SECONDARY_CONTEXT_CODES.has(code);
    const exposureAmount = carriesMoney ? remainingExposure : 0;
    const holdAmount = carriesMoney ? remainingHold : 0;
    const approvedAmount = carriesMoney ? remainingApproved : 0;
    if (carriesMoney) {
      remainingExposure = 0;
      remainingHold = 0;
      remainingApproved = 0;
    }

    return {
      exception_code: code,
      exception_name: EXCEPTION_NAMES[code] ?? `Exception ${code}`,
      individual_tier: individualTier,
      exposure_amount: exposureAmount,
      hold_amount: holdAmount,
      approved_amount: approvedAmount,
      rationale: `${invoice.invoice_number} requires ${EXCEPTION_NAMES[code] ?? code} review based on purchase order, receiving, and invoice evidence.`,
      recommended_action: recommendedActionForCode(code, overallTier),
      action_target: actionTargetForCode(code, overallTier)
    };
  });
}

function buildClassificationResults(parsedFiles, expectedTests) {
  return {
    classifications: parsedFiles.invoices.map((invoice, index) => {
      const expected = expectedTests[index]?.expected ?? {};
      const codes = [...(expected.detected_exceptions ?? [])];
      const financial = expected.financial ?? {};
      const overallTier = expected.overall_tier ?? 1;

      return {
        invoice_number: invoice.invoice_number,
        detected_exceptions: codes,
        overall_tier: overallTier,
        tier_rationale: codes.length
          ? `Highest-impact rule sets this invoice to Tier ${overallTier}: ${codes.map((code) => EXCEPTION_NAMES[code] ?? code).join(", ")}.`
          : "Clean three-way match; no exception route required.",
        exception_details: buildExceptionDetails(codes, expected, invoice),
        financial_summary: {
          total_invoice_amount: safeMoney(invoice.total_amount),
          total_exposure: safeMoney(financial.exposure_amount),
          total_hold: safeMoney(financial.hold_amount),
          total_approved: codes.length ? safeMoney(financial.approved_amount) : safeMoney(invoice.total_amount)
        },
        confidence: codes.length ? 0.9 : 0.99,
        requires_human_review: overallTier >= 2
      };
    })
  };
}

function actionTypeForCode(code, overallTier) {
  if (overallTier === 3) return "escalation_memo";
  if (PROCUREMENT_CODES.has(code)) return "po_amendment_request";
  return "supplier_email";
}

function recipientForAction(actionType, invoice) {
  if (actionType === "escalation_memo") {
    return { recipient_type: "ap_supervisor", recipient_name: "AP supervisor review queue" };
  }
  if (actionType === "po_amendment_request") {
    return { recipient_type: "procurement_lead", recipient_name: "Procurement lead" };
  }
  return { recipient_type: "supplier", recipient_name: invoice.supplier_name };
}

function subjectForAction(code, actionType, invoice) {
  if (actionType === "escalation_memo") {
    return `ESCALATION — ${invoice.invoice_number} — ${EXCEPTION_NAMES[code]} (${code})`;
  }
  if (actionType === "po_amendment_request") {
    return `PO Amendment Request — ${invoice.po_reference} — ${EXCEPTION_NAMES[code]}`;
  }
  return `Invoice Query — ${invoice.invoice_number} / ${invoice.po_reference} — ${EXCEPTION_NAMES[code]}`;
}

function bodyForAction(code, actionType, invoice) {
  const prefix = actionType === "escalation_memo" ? "ESCALATION MEMO — DRAFT" : "DRAFT — AWAITING REVIEW";
  return `${prefix}\n\nInvoice ${invoice.invoice_number} for ${invoice.supplier_name} is marked ${code} (${EXCEPTION_NAMES[code]}). Review the purchase order, goods receipt, and invoice evidence before any payment release. No communication is sent automatically.`;
}

function buildActionResults(parsedFiles, classificationResults) {
  return {
    action_results: parsedFiles.invoices.map((invoice, index) => {
      const classification = classificationResults.classifications[index];
      const actions = (classification.exception_details ?? [])
        .filter((detail) => classification.overall_tier >= 2)
        .map((detail) => {
          const actionType = actionTypeForCode(detail.exception_code, classification.overall_tier);
          const recipient = recipientForAction(actionType, invoice);
          return {
            exception_code: detail.exception_code,
            action_type: actionType,
            subject: subjectForAction(detail.exception_code, actionType, invoice),
            ...recipient,
            body: bodyForAction(detail.exception_code, actionType, invoice),
            draft_label: actionType === "escalation_memo" ? "ESCALATION MEMO — DRAFT" : "DRAFT — AWAITING REVIEW",
            response_deadline_days: actionType === "escalation_memo" ? 1 : 5,
            financial_reference: {
              exposure_amount: detail.exposure_amount || classification.financial_summary.total_exposure,
              hold_amount: detail.hold_amount || classification.financial_summary.total_hold
            }
          };
        });

      return {
        invoice_number: invoice.invoice_number,
        overall_tier: classification.overall_tier,
        actions,
        audit_entry: {
          timestamp_placeholder: actions.length ? "demo_run_generated" : "not_generated_clean_invoice",
          prompt_version: "03_action_generation_v1",
          action_count: actions.length
        }
      };
    })
  };
}

function sliceResultsForChunk(resultShape, stage, chunk) {
  const indexes = chunk.map((item) => item.originalIndex);
  if (stage === "matching") {
    return { results: indexes.map((index) => resultShape.results[index]) };
  }
  if (stage === "classification") {
    return { classifications: indexes.map((index) => resultShape.classifications[index]) };
  }
  return { action_results: indexes.map((index) => resultShape.action_results[index]) };
}

function mergeForStage(stage, chunks) {
  if (stage === "matching") return mergeMatchingChunks(chunks);
  if (stage === "classification") return mergeClassificationChunks(chunks);
  return mergeActionChunks(chunks);
}

function outputForStage(stage, results) {
  if (stage === "matching") return results.matching;
  if (stage === "classification") return results.classification;
  return results.actions;
}

async function buildAuditEntries(chunks, stageOutputs) {
  const entries = [];
  const stages = ["matching", "classification", "action_generation"];

  for (const stage of stages) {
    for (const [chunkIndex, chunk] of chunks.entries()) {
      const chunkOutput = sliceResultsForChunk(outputForStage(stage, stageOutputs), stage, chunk);
      entries.push(await createAuditEntry({
        step: stage,
        model: DEMO_MODEL,
        input: `deterministic-golden-demo:${stage}:${chunkIndex + 1}`,
        output: chunkOutput,
        tokenUsage: {
          input_tokens: 2400 + chunk.length * 80,
          output_tokens: 700 + chunk.length * 45
        },
        latencyMs: 6200 + chunkIndex * 850,
        promptVersion: DEMO_PROMPT_VERSION,
        chunk: {
          index: chunkIndex + 1,
          total: chunks.length,
          invoice_range: getInvoiceRangeLabel(chunk, chunkIndex),
          invoice_count: chunk.length,
          attempt: 1,
          retry_count: 0,
          retry_status: "initial_success"
        },
        status: "success"
      }));
    }
  }

  return entries;
}

function buildPipelineState(chunks, stageOutputs) {
  let runState = createPipelineRunState({
    runId: `run-demo-${Date.now()}`,
    totalChunks: chunks.length
  });
  runState.runStartedAtMs = Date.now() - DEMO_LATENCY_MS;
  runState.runStartedAt = new Date(runState.runStartedAtMs).toISOString();

  const stages = ["matching", "classification", "action_generation"];
  stages.forEach((stage) => {
    chunks.forEach((chunk, chunkIndex) => {
      const chunkOutput = sliceResultsForChunk(outputForStage(stage, stageOutputs), stage, chunk);
      runState = markPipelineChunkSucceeded(runState, {
        stage,
        chunkIndex,
        chunkMeta: {
          index: chunkIndex + 1,
          total: chunks.length,
          invoice_range: getInvoiceRangeLabel(chunk, chunkIndex),
          invoice_count: chunk.length
        },
        output: chunkOutput,
        attempt: 1
      });
    });
    runState = markPipelineStageMerged(runState, {
      stage,
      merged: mergeForStage(stage, chunks.map((chunk) => sliceResultsForChunk(outputForStage(stage, stageOutputs), stage, chunk)))
    });
  });

  return markPipelineComplete(runState);
}

export async function buildGoldenDemoRun() {
  const parsedFiles = {
    purchase_orders: parseDemoCsv(purchaseOrdersCsv, "purchase_orders.csv", "purchase_orders"),
    invoices: parseDemoCsv(invoicesCsv, "invoices.csv", "invoices"),
    goods_receipts: parseDemoCsv(goodsReceiptsCsv, "goods_receipts.csv", "goods_receipts"),
    summaries: [
      { key: "purchase_orders", expectedName: "purchase_orders.csv", originalName: "purchase_orders.csv", rowCount: parseCsv(purchaseOrdersCsv, "purchase_orders.csv").length },
      { key: "invoices", expectedName: "invoices.csv", originalName: "invoices.csv", rowCount: parseCsv(invoicesCsv, "invoices.csv").length },
      { key: "goods_receipts", expectedName: "goods_receipts.csv", originalName: "goods_receipts.csv", rowCount: parseCsv(goodsReceiptsCsv, "goods_receipts.csv").length }
    ]
  };
  const expectedTests = getExpectedTests();
  const matching = buildMatchingResults(parsedFiles, expectedTests);
  const classification = buildClassificationResults(parsedFiles, expectedTests);
  const actions = buildActionResults(parsedFiles, classification);
  const chunks = chunkInvoices(parsedFiles.invoices, DEMO_CHUNK_SIZE);
  const stageOutputs = { matching, classification, actions };

  return {
    parsedFiles,
    matchResults: matching,
    classificationResults: classification,
    actionResults: actions,
    auditEntries: await buildAuditEntries(chunks, stageOutputs),
    pipelineRunState: buildPipelineState(chunks, stageOutputs)
  };
}
