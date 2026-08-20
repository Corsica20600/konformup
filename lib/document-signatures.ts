import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const KARINE_SIGNATURE_RELATIVE_PATH = ["documents", "Signature", "Signature_Karine.jpg"] as const;
const JPEG_PREFIX = [0xff, 0xd8, 0xff] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TrainerDocumentSignature = Readonly<{
  src: string;
  width: number;
  height: number;
}>;

export type TrainerSignatureResolution =
  | Readonly<{ signature: TrainerDocumentSignature; reason: "matched" }>
  | Readonly<{
      signature: null;
      reason: "not_configured" | "invalid_configuration" | "no_assigned_profile" | "different_trainer" | "asset_unavailable";
    }>;

function getSignaturePath() {
  return path.join(process.cwd(), ...KARINE_SIGNATURE_RELATIVE_PATH);
}

type SignatureFileReader = () => Promise<Buffer>;

function getConfiguredKarineProfileId() {
  const configuredProfileId = process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID?.trim();

  if (!configuredProfileId) {
    return { value: null, reason: "not_configured" as const };
  }

  if (!UUID_PATTERN.test(configuredProfileId)) {
    return { value: null, reason: "invalid_configuration" as const };
  }

  return { value: configuredProfileId, reason: null };
}

function readJpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || !JPEG_PREFIX.every((value, index) => bytes[index] === value)) {
    return null;
  }

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd8 || marker === 0xd9) {
      continue;
    }

    if (offset + 2 > bytes.length) {
      return null;
    }

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      return null;
    }

    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3;
    if (isStartOfFrame) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += segmentLength;
  }

  return null;
}

/**
 * Resolves Karine's handwritten signature only for the configured Auth profile.
 * The asset is read server-side and passed directly to React-PDF; it is never
 * exposed through a route, a client component, or a public URL.
 */
async function resolveKarineTrainerSignatureWithReader(
  trainerProfileId: string | null | undefined,
  readSignatureFile: SignatureFileReader
): Promise<TrainerSignatureResolution> {
  const configured = getConfiguredKarineProfileId();
  if (!configured.value) {
    return { signature: null, reason: configured.reason! };
  }

  if (!trainerProfileId) {
    return { signature: null, reason: "no_assigned_profile" };
  }

  if (trainerProfileId !== configured.value) {
    return { signature: null, reason: "different_trainer" };
  }

  try {
    const bytes = await readSignatureFile();
    const dimensions = readJpegDimensions(bytes);
    if (!dimensions) {
      return { signature: null, reason: "asset_unavailable" };
    }

    return {
      signature: {
        src: `data:image/jpeg;base64,${bytes.toString("base64")}`,
        width: dimensions.width,
        height: dimensions.height
      },
      reason: "matched"
    };
  } catch {
    return { signature: null, reason: "asset_unavailable" };
  }
}

export async function resolveKarineTrainerSignature(
  trainerProfileId: string | null | undefined
): Promise<TrainerSignatureResolution> {
  return resolveKarineTrainerSignatureWithReader(trainerProfileId, () => readFile(getSignaturePath()));
}

export const documentSignatureTesting = {
  getSignaturePath,
  getConfiguredKarineProfileId,
  readJpegDimensions,
  resolveKarineTrainerSignatureWithReader
};
