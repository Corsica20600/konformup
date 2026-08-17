import { describe, expect, it } from "vitest";
import { getVideoEmbedUrl } from "@/lib/formation-media";

describe("formation media", () => {
  it("converts common YouTube links to projection-safe embed URLs", () => {
    expect(getVideoEmbedUrl("https://www.youtube.com/watch?v=abc123&t=10")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
    expect(getVideoEmbedUrl("https://youtu.be/abc123?si=test")).toBe("https://www.youtube.com/embed/abc123");
  });

  it("keeps other support URLs unchanged", () => {
    expect(getVideoEmbedUrl("https://videos.example.com/support.mp4")).toBe(
      "https://videos.example.com/support.mp4"
    );
  });
});
