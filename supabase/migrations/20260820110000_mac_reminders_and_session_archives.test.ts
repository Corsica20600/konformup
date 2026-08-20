import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260820110000_mac_reminders_and_session_archives.sql"), "utf8");

describe("MAC reminders and session archive SQL contract", () => {
  it("keeps reminder delivery idempotent and private", () => {
    expect(migration).toContain("create table if not exists public.mac_sst_reminders");
    expect(migration).toContain("idempotency_key text not null unique");
    expect(migration).toContain("claim_mac_sst_reminder");
    expect(migration).toContain("revoke all on public.mac_sst_reminders from anon");
  });
  it("creates a private immutable archive manifest contract", () => {
    expect(migration).toContain("'session-archives', 'session-archives', false");
    expect(migration).toContain("create table if not exists public.session_archives");
    expect(migration).toContain("manifest_hash text");
    expect(migration).toContain("on delete restrict");
    expect(migration).toContain("session_archives_storage_read");
  });
});
