import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-white/80 text-ink",
        tone === "success" && "bg-pine/10 text-pine",
        tone === "warning" && "bg-accent/15 text-accent"
      )}
    >
      {children}
    </span>
  );
}
