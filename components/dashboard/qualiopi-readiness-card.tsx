import { Card } from "@/components/ui/card";
import type { QualiopiReadinessSnapshot } from "@/lib/qualiopi";

export function QualiopiReadinessCard({ snapshot }: { snapshot: QualiopiReadinessSnapshot }) {
  return (
    <Card>
      <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Préparation Qualiopi</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{snapshot.completionRate}% prêt</h2>
          <p className="mt-2 text-sm text-ink/65">
            Contrôle rapide des informations déjà disponibles dans l’application.
          </p>
        </div>
        <div className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink">
          {snapshot.blockingItems.length} blocage(s) • {snapshot.warningItems.length} vigilance(s)
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${snapshot.completionRate}%` }} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-ink">Blocants</h3>
          {snapshot.blockingItems.length ? (
            <div className="mt-3 grid gap-3">
              {snapshot.blockingItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-accent/15 bg-accent/5 px-4 py-3">
                  <p className="text-sm font-semibold text-accent">{item.label}</p>
                  <p className="mt-1 text-sm text-ink/70">{item.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/65">Aucun blocage identifié sur les données actuellement disponibles.</p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-ink">Points de vigilance</h3>
          {snapshot.warningItems.length ? (
            <div className="mt-3 grid gap-3">
              {snapshot.warningItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-ink/10 bg-canvas/70 px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-1 text-sm text-ink/70">{item.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/65">Aucun point de vigilance détecté à ce stade.</p>
          )}
        </section>
      </div>
    </Card>
  );
}
