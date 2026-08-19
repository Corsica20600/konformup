const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = { 'application/pdf': { extensions: ['pdf'], signature: [0x25,0x50,0x44,0x46] }, 'image/jpeg': { extensions: ['jpg','jpeg'], signature: [0xff,0xd8,0xff] }, 'image/png': { extensions: ['png'], signature: [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a] } } as const;
export type ComplaintMime = keyof typeof TYPES;
export function cleanComplaintFilename(name: string) { return name.replace(/[\\/\0]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 180) || 'document'; }
export function validateComplaintFile(file: { name: string; type: string; size: number; bytes: Uint8Array }) {
  const mime = file.type.toLowerCase() as ComplaintMime; const config = TYPES[mime];
  if (!file.size) throw new Error('Le fichier est vide.'); if (file.size > MAX_BYTES) throw new Error('Le fichier dépasse 10 Mo.');
  const extension = cleanComplaintFilename(file.name).split('.').pop()?.toLowerCase();
  if (!config || !extension || !config.extensions.includes(extension as never) || !config.signature.every((byte, index) => file.bytes[index] === byte)) throw new Error('Le type, l’extension ou la signature du fichier est invalide.');
  return { mime, extension, filename: cleanComplaintFilename(file.name), size: file.size };
}
export const validateComplaintAttachment = validateComplaintFile;
