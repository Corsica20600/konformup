import { describe, expect, it } from "vitest";
import { cleanSharedResourceFilename, validateSharedTrainingResourceFile, validateSharedTrainingResourceUrl } from "@/lib/shared-training-resource-validation";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 1]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1]);

describe("shared training resource validation", () => {
  it.each([["support.pdf", "application/pdf", pdf], ["photo.jpg", "image/jpeg", jpeg], ["photo.png", "image/png", png], ["support.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", zip], ["slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation", zip], ["table.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", zip]])("accepts allowed %s", (name, type, bytes) => expect(validateSharedTrainingResourceFile({ name, type, size: bytes.length, bytes })).toMatchObject({ size: bytes.length }));
  it.each([["support.pdf", "application/pdf", new Uint8Array()], ["malware.exe", "application/octet-stream", pdf], ["fake.pdf", "application/pdf", jpeg], ["wrong.jpg", "application/pdf", pdf]])("rejects invalid %s", (name, type, bytes) => expect(() => validateSharedTrainingResourceFile({ name, type, size: bytes.length, bytes })).toThrow());
  it("rejects more than 20 MB and cleans metadata filenames", () => { expect(() => validateSharedTrainingResourceFile({ name: "large.pdf", type: "application/pdf", size: 20 * 1024 * 1024 + 1, bytes: pdf })).toThrow(); expect(cleanSharedResourceFilename(" ../Karine\\support .PDF ")).toBe(".._Karine_support .PDF"); });
  it("accepts only HTTPS links", () => { expect(validateSharedTrainingResourceUrl("https://example.test/resource").hostname).toBe("example.test"); expect(() => validateSharedTrainingResourceUrl("http://example.test")).toThrow(); expect(() => validateSharedTrainingResourceUrl("javascript:alert(1)")).toThrow(); });
});
