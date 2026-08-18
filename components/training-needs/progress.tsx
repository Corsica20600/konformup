"use client";

export function TrainingNeedsProgress({ step, percent }: { step: number; percent: number }) {
  return <div aria-label={`Étape ${step} sur 5`} className="mt-6"><div className="mb-2 flex justify-between text-xs font-semibold text-ink/60"><span>Étape {step} sur 5</span><span>{percent}% complété</span></div><div className="h-2 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-pine transition-all duration-300" style={{ width: `${Math.max(percent, step === 1 ? 5 : 0)}%` }} /></div></div>;
}
