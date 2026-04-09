import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-[28px] bg-white/90 p-6 shadow-panel", className)}>{children}</section>;
}
