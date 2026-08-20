import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuthenticatedUser: vi.fn(), validateFile: vi.fn(), validateUrl: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAuthenticatedUser: mocks.requireAuthenticatedUser, AuthenticationError: class AuthenticationError extends Error {}, AuthorizationError: class AuthorizationError extends Error {} }));
vi.mock("@/lib/shared-training-resource-validation", () => ({ validateSharedTrainingResourceFile: mocks.validateFile, validateSharedTrainingResourceUrl: mocks.validateUrl }));
import { createSharedTrainingResource, createSharedTrainingResourceSignedUrl } from "@/lib/shared-training-resources";

describe("shared training resources service", () => {
  beforeEach(() => vi.resetAllMocks());
  it("refuses a simple trainer before any storage action", async () => {
    const from = vi.fn(); mocks.requireAuthenticatedUser.mockResolvedValue({ user: { id: "user" }, profile: { role: "trainer" }, supabase: { from, storage: { from: vi.fn() } } });
    await expect(createSharedTrainingResource({ title: "Support", category: "support", priority: "normal", externalUrl: "https://example.test" })).rejects.toMatchObject({ code: "unauthorized" });
    expect(from).not.toHaveBeenCalled();
  });
  it("creates a HTTPS link without storage upload or automatic module mutation", async () => {
    const notifications = { upsert: vi.fn().mockResolvedValue({ error: null }) };
    const audit = { insert: vi.fn().mockResolvedValue({ error: null }) };
    const versions = { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })) })) })) })), insert: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "version" }, error: null }) })) })) };
    const resources = { insert: vi.fn(() => ({ select: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "resource" }, error: null }) })) })), select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "resource", resource_type: "link", created_by: "user" }, error: null }) })) })), update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) };
    const profiles = { select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: [], error: null }) })) };
    const from = vi.fn((table: string) => ({ shared_training_resources: resources, shared_training_resource_versions: versions, shared_training_resource_audit: audit, shared_training_resource_notifications: notifications, profiles })[table]);
    mocks.requireAuthenticatedUser.mockResolvedValue({ user: { id: "user" }, profile: { role: "lead_trainer" }, supabase: { from, storage: { from: vi.fn() } } }); mocks.validateUrl.mockReturnValue(new URL("https://example.test/resource"));
    await createSharedTrainingResource({ title: "Support", category: "support", priority: "normal", externalUrl: "https://example.test/resource" });
    expect(resources.insert).toHaveBeenCalledWith(expect.objectContaining({ resource_type: "link", training_module_id: null }));
    expect(versions.insert).toHaveBeenCalledWith(expect.objectContaining({ resource_type: "link", external_url: "https://example.test/resource" }));
  });
  it("creates a signed URL only after manager access and never returns a storage path", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.test/file" }, error: null });
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { storage_bucket: "shared-training-resources", storage_path: "resources/a/versions/b.pdf" }, error: null }) })) })) }));
    mocks.requireAuthenticatedUser.mockResolvedValue({ user: { id: "user" }, profile: { role: "admin" }, supabase: { from, storage: { from: vi.fn(() => ({ createSignedUrl })) } } });
    await expect(createSharedTrainingResourceSignedUrl("version")).resolves.toEqual({ url: "https://signed.test/file", expiresIn: 300 });
    expect(createSignedUrl).toHaveBeenCalledWith("resources/a/versions/b.pdf", 300);
  });
});
