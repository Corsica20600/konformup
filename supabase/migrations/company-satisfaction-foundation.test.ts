import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260819200000_company_satisfaction_foundation.sql", "utf8");

describe("company satisfaction SQL foundation", () => {
  it("keeps anonymous access behind secure RPCs and atomic uniqueness constraints", () => {
    expect(migration).toContain("send_company_satisfaction boolean not null default false");
    expect(migration).toContain("company_satisfaction_surveys_invoice_id_key");
    expect(migration).toContain("company_satisfaction_surveys_company_session_key");
    expect(migration).toContain("alter table public.company_satisfaction_surveys enable row level security");
    expect(migration).toContain("revoke all on public.company_satisfaction_surveys from anon");
    expect(migration).toContain("security definer set search_path = public, extensions");
    expect(migration).toContain("and submitted_at is null");
    expect(migration).toContain("return 'already_completed'");
  });

  it("does not grant anonymous table access or publish without consent and approval", () => {
    expect(migration).not.toMatch(/grant\s+(select|insert|update|delete)\s+on\s+public\.company_satisfaction_surveys\s+to\s+anon/i);
    expect(migration).toContain("published_at is null or (publication_consent and moderation_status = 'approved')");
    expect(migration).toContain("public.can_access_session(session_id)");
  });
});
