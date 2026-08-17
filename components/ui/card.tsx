import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("rounded-[28px] bg-white/90 p-6 shadow-panel", className)} {...props}>
      {children}
    </section>
  );
}
