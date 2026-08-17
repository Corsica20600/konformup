import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
};

export function SelectField({ label, hint, className, children, ...props }: Props) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
      <span>{label}</span>
      <span className="relative">
        <select
          className={cn(
            "w-full appearance-none rounded-[8px] border border-ink/10 bg-white px-4 py-3 pr-10 text-sm shadow-sm transition focus:border-pine focus:ring-2 focus:ring-pine/10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink/50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/45">
          ⌄
        </span>
      </span>
      {hint ? <span className="text-xs font-normal leading-5 text-ink/55">{hint}</span> : null}
    </label>
  );
}
