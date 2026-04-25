const NUMERIC_FIELDS = new Set([
  "quantity",
  "quantity_invoiced",
  "quantity_received",
  "unit_price",
  "total_amount"
]);

export const REQUIRED_HEADERS = {
  purchase_orders: [
    "po_number",
    "po_date",
    "supplier_id",
    "supplier_name",
    "item_code",
    "item_description",
    "quantity",
    "unit_price",
    "uom",
    "total_amount",
    "warehouse_code",
    "payment_terms",
    "supplier_diversity_cert"
  ],
  invoices: [
    "invoice_number",
    "invoice_date",
    "supplier_id",
    "supplier_name",
    "po_reference",
    "item_code",
    "item_description",
    "quantity_invoiced",
    "unit_price",
    "uom",
    "total_amount",
    "notes"
  ],
  goods_receipts: [
    "grn_number",
    "grn_date",
    "po_reference",
    "item_code",
    "quantity_received",
    "receiving_warehouse",
    "received_by"
  ]
};

const FILE_SPECS = {
  "purchase_orders.csv": "purchase_orders",
  "invoices.csv": "invoices",
  "goods_receipts.csv": "goods_receipts"
};

function parseRows(text, filename) {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === "\"" && source[i + 1] === "\"") {
        field += "\"";
        i += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error(`${filename} has an unterminated quoted field`);
  }

  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  return rows;
}

function convertValue(header, value, rowNumber, filename) {
  if (!NUMERIC_FIELDS.has(header)) return value;
  if (value === "") {
    throw new Error(`${filename} row ${rowNumber} has an empty numeric value for ${header}`);
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${filename} row ${rowNumber} has invalid numeric value for ${header}: ${value}`);
  }

  return numberValue;
}

export function parseCsv(text, filename = "CSV file") {
  if (!text || text.trim() === "") {
    throw new Error(`${filename} is empty`);
  }

  const rows = parseRows(text, filename);
  if (rows.length < 2) {
    throw new Error(`${filename} must include a header row and at least one data row`);
  }

  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  if (headers.some((header) => header === "")) {
    throw new Error(`${filename} has an empty column header`);
  }

  return rows.slice(1).map((cells, rowIndex) => {
    if (cells.length > headers.length) {
      throw new Error(`${filename} row ${rowIndex + 2} has more columns than the header row`);
    }

    const record = {};
    headers.forEach((header, index) => {
      record[header] = convertValue(header, cells[index] ?? "", rowIndex + 2, filename);
    });
    return record;
  });
}

export function validateRequiredHeaders(rows, filename, requiredHeaders) {
  const firstRow = rows[0];
  const headers = firstRow ? Object.keys(firstRow) : [];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`${filename} is missing required column: ${header}`);
    }
  }
}

function resolveFileKey(file) {
  const lowerName = file.name.toLowerCase();
  return FILE_SPECS[lowerName] ?? null;
}

export async function normalizeProcurementFiles(files) {
  const selectedFiles = Array.from(files ?? []);
  if (selectedFiles.length === 0) {
    throw new Error("Upload purchase_orders.csv, invoices.csv, and goods_receipts.csv to continue");
  }

  const unexpected = selectedFiles.find((file) => !resolveFileKey(file));
  if (unexpected) {
    throw new Error(`Unexpected file: ${unexpected.name}. Upload only the three required CSV files`);
  }

  const duplicateNames = selectedFiles
    .map((file) => file.name.toLowerCase())
    .filter((name, index, names) => names.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    throw new Error(`Duplicate file uploaded: ${duplicateNames[0]}`);
  }

  const byKey = new Map(selectedFiles.map((file) => [resolveFileKey(file), file]));
  for (const [filename, key] of Object.entries(FILE_SPECS)) {
    if (!byKey.has(key)) {
      throw new Error(`Missing required file: ${filename}`);
    }
  }

  const normalized = { summaries: [] };
  for (const [filename, key] of Object.entries(FILE_SPECS)) {
    const file = byKey.get(key);
    const text = await file.text();
    const rows = parseCsv(text, file.name);
    validateRequiredHeaders(rows, filename, REQUIRED_HEADERS[key]);
    normalized[key] = rows;
    normalized.summaries.push({
      key,
      expectedName: filename,
      originalName: file.name,
      rowCount: rows.length
    });
  }

  return normalized;
}
