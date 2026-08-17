import { describe, expect, it, vi } from "vitest";
import { AuthenticationError, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCompanyAction } from "./actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");

  return {
    ...actual,
    requireUser: vi.fn()
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

describe("company server actions", () => {
  it("refuses company creation without an authenticated user", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new AuthenticationError());

    const formData = new FormData();
    formData.set("companyName", "Societe test");

    await expect(createCompanyAction({}, formData)).rejects.toBeInstanceOf(AuthenticationError);
    expect(createClient).not.toHaveBeenCalled();
  });
});
