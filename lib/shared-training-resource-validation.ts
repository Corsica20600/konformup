const MAX_BYTES = 20 * 1024 * 1024;
const TYPES = {
  "application/pdf": { extensions: ["pdf"], signature: [0x25, 0x50, 0x44, 0x46] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { extensions: ["docx"], signature: [0x50, 0x4b, 0x03, 0x04] },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { extensions: ["pptx"], signature: [0x50, 0x4b, 0x03, 0x04] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { extensions: ["xlsx"], signature: [0x50, 0x4b, 0x03, 0x04] },
  "image/jpeg": { extensions: ["jpg", "jpeg"], signature: [0xff, 0xd8, 0xff] },
  "image/png": { extensions: ["png"], signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  "image/webp": { extensions: ["webp"], signature: [0x52, 0x49, 0x46, 0x46] }
} as const;
export type SharedResourceMime = keyof typeof TYPES;

export function cleanSharedResourceFilename(name: string) { return name.replace(/[\\/\0]/g, "_").replace(/\s+/g, " ").trim().slice(0, 180) || "document"; }
export function validateSharedTrainingResourceFile(file: { name: string; type: string; size: number; bytes: Uint8Array }) {
  const mime = file.type.toLowerCase() as SharedResourceMime;
  const config = TYPES[mime];
  const extension = cleanSharedResourceFilename(file.name).split(".").pop()?.toLowerCase();
  if (!file.size) throw new Error("Le fichier est vide.");
  if (file.size > MAX_BYTES) throw new Error("Le fichier dépasse 20 Mo.");
  if (!config || !extension || !config.extensions.includes(extension as never) || !config.signature.every((value, index) => file.bytes[index] === value)) throw new Error("Le type, l’extension ou la signature du fichier est invalide.");
  return { mime, extension, filename: cleanSharedResourceFilename(file.name), size: file.size };
}

export function validateSharedTrainingResourceUrl(value: string) {
  try { const url = new URL(value); if (url.protocol !== "https:") throw new Error(); return url; }
  catch { throw new Error("Le lien doit utiliser HTTPS."); }
}
