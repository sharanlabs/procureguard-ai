# Architectural Decision Log — ProcureGuard AI

Decisions are logged as they are made. Each entry is immutable once written. Later decisions may supersede earlier ones — the superseding entry references the original.

---

## DECISION-001: Prompt chaining workflow, not autonomous agent

**Date:** April 22, 2026
**Stage:** Planning
**Status:** Accepted

**Context:** The task has a fixed sequence (match → classify → act). The LLM provides reasoning within each step, not navigation between steps.

**Decision:** Build as a prompt chaining workflow with gate checks between steps.

**Alternatives considered:**
- Autonomous agent: rejected because steps are predefined, not dynamic
- Single monolithic prompt: rejected because debugging is impossible and errors compound

**Rationale:** Anthropic and OpenAI both recommend starting with the simplest pattern. Prompt chaining is the recommended starting point for fixed-sequence tasks.

**Consequences:** Each LLM call has a focused scope. Gate checks between steps catch errors early. Easier to debug, test, and maintain.

---

(Additional decisions will be logged as they are made through Stages 2-7.)
