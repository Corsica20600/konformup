export function getVideoEmbedUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : value;
    }

    if (url.hostname.endsWith("youtube.com") && url.pathname === "/watch") {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : value;
    }
  } catch {
    return value;
  }

  return value;
}
