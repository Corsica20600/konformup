import { afterEach, describe, expect, it } from "vitest";
import { documentSignatureTesting, resolveKarineTrainerSignature } from "@/lib/document-signatures";

const KARINE_PROFILE_ID = "00000000-0000-4000-8000-000000000042";
const originalProfileId = process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID;

function validJpeg(width = 160, height = 80) {
  return Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
    0xff,
    0xd9
  ]);
}

afterEach(() => {
  if (originalProfileId === undefined) {
    delete process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID;
  } else {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = originalProfileId;
  }
});

describe("trainer document signatures", () => {
  it("loads Karine's local signature only for the configured stable profile", async () => {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = KARINE_PROFILE_ID;

    const result = await resolveKarineTrainerSignature(KARINE_PROFILE_ID);

    expect(result.reason).toBe("matched");
    expect(result.signature?.src).toMatch(/^data:image\/jpeg;base64,/);
    expect(result.signature?.width).toBeGreaterThan(0);
    expect(result.signature?.height).toBeGreaterThan(0);
    expect((result.signature?.width ?? 0) / (result.signature?.height ?? 1)).toBeGreaterThan(1);
    expect(result.signature?.src).not.toContain("documents/Signature");
  });

  it("normalizes a configured profile ID with trailing whitespace", async () => {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = `${KARINE_PROFILE_ID}  `;

    const result = await documentSignatureTesting.resolveKarineTrainerSignatureWithReader(
      KARINE_PROFILE_ID,
      async () => validJpeg()
    );

    expect(result.reason).toBe("matched");
    expect(result.signature).not.toBeNull();
  });

  it("handles an invalid configured profile ID without attempting a profile lookup or file read", async () => {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = "not-a-uuid";
    let fileRead = false;

    const result = await documentSignatureTesting.resolveKarineTrainerSignatureWithReader(
      KARINE_PROFILE_ID,
      async () => {
        fileRead = true;
        return validJpeg();
      }
    );

    expect(result).toEqual({ signature: null, reason: "invalid_configuration" });
    expect(fileRead).toBe(false);
  });

  it("never loads Karine's signature for another trainer", async () => {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = KARINE_PROFILE_ID;
    let fileRead = false;
    const readSignatureFile = async () => {
      fileRead = true;
      return validJpeg();
    };

    const result = await documentSignatureTesting.resolveKarineTrainerSignatureWithReader(
      "00000000-0000-4000-8000-000000000043",
      readSignatureFile
    );

    expect(result).toEqual({ signature: null, reason: "different_trainer" });
    expect(fileRead).toBe(false);
  });

  it("keeps the signature absent when the configuration or assigned profile is missing", async () => {
    delete process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID;
    await expect(resolveKarineTrainerSignature(KARINE_PROFILE_ID)).resolves.toEqual({
      signature: null,
      reason: "not_configured"
    });

    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = KARINE_PROFILE_ID;
    await expect(resolveKarineTrainerSignature(null)).resolves.toEqual({
      signature: null,
      reason: "no_assigned_profile"
    });
  });

  it("handles an unavailable or invalid asset without leaking its path", async () => {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = KARINE_PROFILE_ID;

    const invalid = await documentSignatureTesting.resolveKarineTrainerSignatureWithReader(
      KARINE_PROFILE_ID,
      async () => Buffer.from("not-a-jpeg")
    );
    const missing = await documentSignatureTesting.resolveKarineTrainerSignatureWithReader(
      KARINE_PROFILE_ID,
      async () => Promise.reject(new Error("missing local asset"))
    );

    expect(invalid).toEqual({ signature: null, reason: "asset_unavailable" });
    expect(missing).toEqual({ signature: null, reason: "asset_unavailable" });
  });

  it("reads JPEG dimensions for a ratio-preserving PDF image", () => {
    expect(documentSignatureTesting.readJpegDimensions(validJpeg(240, 80))).toEqual({ width: 240, height: 80 });
    expect(documentSignatureTesting.readJpegDimensions(Buffer.from([0x00, 0x01]))).toBeNull();
  });
});
