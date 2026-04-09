import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, ...props }: Props) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
      <span>{label}</span>
      <input
        className={cn(
          "rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-accent">{error}</span> : null}
    </label>
  );
}
