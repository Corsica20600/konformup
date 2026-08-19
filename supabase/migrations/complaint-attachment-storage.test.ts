import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync("supabase/migrations/20260819210000_complaint_attachment_storage.sql", "utf8");
describe("complaint attachment storage contract", () => it("is private and role constrained", () => {
  expect(sql).toContain("'complaint-attachments', 'complaint-attachments', false");
  expect(sql).toContain("create table if not exists public.invoice_complaint_attachments");
  expect(sql).toContain("storage_path text not null unique"); expect(sql).toContain("on delete restrict");
  expect(sql).toContain("enable row level security"); expect(sql).toContain("can_access_invoice_complaint");
  expect(sql).toContain("size_bytes <= 10485760"); expect(sql).toContain("image/png");
  expect(sql).not.toMatch(/to\s+anon/i); expect(sql).not.toMatch(/using\s*\(true\)/i);
}));
