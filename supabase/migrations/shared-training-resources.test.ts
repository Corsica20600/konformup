import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260820150000_shared_training_resources.sql"), "utf8");

describe("shared training resources migration contract", () => {
  it("creates a private versioned storage model without anonymous access", () => { expect(sql).toContain("'shared-training-resources', false"); expect(sql).toContain("shared_training_resources"); expect(sql).toContain("shared_training_resource_versions"); expect(sql).toContain("storage_path text null unique"); expect(sql).toContain("sha256 text null"); expect(sql).toContain("enable row level security"); expect(sql).toContain("revoke all on table"); });
  it("keeps module links optional and prohibits automatic pedagogical changes", () => { expect(sql).toContain("training_module_id uuid null"); expect(sql).toContain("on delete set null"); expect(sql).toContain("never changes a module automatically"); });
  it("limits access to operational managers and admin-only decisions", () => { expect(sql).toContain("public.is_operational_manager()"); expect(sql).toContain("public.current_app_role()::text = 'admin'"); expect(sql).not.toMatch(/to anon[\s\S]*using \(true\)/i); });
  it("records comments, audit events and deduplicated notifications", () => { expect(sql).toContain("shared_training_resource_comments"); expect(sql).toContain("shared_training_resource_audit"); expect(sql).toContain("shared_training_resource_notifications"); expect(sql).toContain("dedupe_key text not null unique"); expect(sql).toContain("shared_resource_notifications_manager_insert"); });
});
