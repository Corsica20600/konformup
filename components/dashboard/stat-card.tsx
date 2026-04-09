import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <p className="text-sm uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </Card>
  );
}
