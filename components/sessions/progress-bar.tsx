export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-2">
      <div className="h-3 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs font-semibold text-ink/55">{value}% de progression globale</p>
    </div>
  );
}
