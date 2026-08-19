import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireAuthenticatedUser: vi.fn(), validate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAuthenticatedUser: mocks.requireAuthenticatedUser, AuthenticationError: class AuthenticationError extends Error {}, AuthorizationError: class AuthorizationError extends Error {}, ResourceNotFoundError: class ResourceNotFoundError extends Error {} }));
vi.mock("@/lib/complaint-attachment-validation", () => ({ validateComplaintFile: mocks.validate }));
import { uploadComplaintAttachment } from "@/lib/complaint-attachments";
describe("complaint attachment service", () => {
  beforeEach(() => vi.resetAllMocks());
  it("uploads only after an authorized complaint lookup and records metadata", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null }); const insert = vi.fn(() => ({ select: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "a" }, error: null }) }) }));
    const from = vi.fn((table: string) => table === "invoice_complaints" ? ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "c", company_id: "company" }, error: null }) }) }) }) : ({ insert }));
    mocks.requireAuthenticatedUser.mockResolvedValue({ user: { id: "user" }, supabase: { from, storage: { from: vi.fn(() => ({ upload })) } } }); mocks.validate.mockReturnValue({ extension: "pdf", mime: "application/pdf", filename: "client.pdf", size: 4 });
    const file = { name: "client.pdf", type: "application/pdf", size: 4, arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1,2,3,4]).buffer) } as unknown as File;
    await uploadComplaintAttachment("c", file);
    expect(upload).toHaveBeenCalledTimes(1); expect(upload.mock.calls[0]?.[0]).toMatch(/^companies\/company\/complaints\/c\/[0-9a-f-]+\.pdf$/); expect(insert).toHaveBeenCalledWith(expect.objectContaining({ bucket_id: "complaint-attachments", original_filename: "client.pdf" }));
  });
});
