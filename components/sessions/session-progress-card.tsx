import { Card } from "@/components/ui/card";

export function SessionProgressCard({
  value,
  completedCount,
  totalCount
}: {
  value: number;
  completedCount: number;
  totalCount: number;
}) {
  return (
    <Card>
      <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Progression globale</p>
      <h3 className="mt-2 text-2xl font-bold">{value}%</h3>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-3 text-sm text-ink/60">
        {completedCount} module(s) terminé(s) sur {totalCount}
      </p>
    </Card>
  );
}
