import { describe, expect, it } from "vitest";
import { cleanComplaintFilename, validateComplaintAttachment } from "@/lib/complaint-attachment-validation";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 1]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
describe("complaint attachment validation", () => {
  it.each([["a.pdf", "application/pdf", pdf], ["a.jpg", "image/jpeg", jpeg], ["a.png", "image/png", png]])("accepts valid %s", (name, type, bytes) => expect(validateComplaintAttachment({ name, type, size: bytes.length, bytes })).toMatchObject({ size: bytes.length }));
  it.each([["a.pdf", "application/pdf", new Uint8Array()], ["a.exe", "application/octet-stream", pdf], ["a.jpg", "application/pdf", pdf], ["a.pdf", "application/pdf", jpeg], ["a.jpg", "image/jpeg", png]])("rejects invalid input", (name, type, bytes) => expect(() => validateComplaintAttachment({ name, type, size: bytes.length, bytes })).toThrow());
  it("rejects files larger than 10 MB and cleans names", () => {
    expect(() => validateComplaintAttachment({ name: "a.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1, bytes: pdf })).toThrow();
    expect(cleanComplaintFilename(" ../Client\\ document .PDF ")).toBe(".._Client_ document .PDF");
  });
});
