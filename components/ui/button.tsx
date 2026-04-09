import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
        variant === "primary" && "bg-pine text-white hover:bg-ink",
        variant === "secondary" && "bg-sand text-ink hover:bg-[#d8ceb9]",
        variant === "ghost" && "bg-transparent text-ink hover:bg-white/60",
        variant === "danger" && "bg-accent text-white hover:opacity-90",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
