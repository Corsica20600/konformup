import Link from "next/link";
import { SessionModule } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SessionModuleList({
  sessionId,
  modules,
  selectedModuleId
}: {
  sessionId: string;
  modules: SessionModule[];
  selectedModuleId: string;
}) {
  return (
    <div className="grid gap-2">
      {modules.map((module) => (
        <Link
          key={module.id}
          href={`/sessions/${sessionId}?module=${module.id}`}
          className={cn(
            "rounded-2xl border px-4 py-3 transition",
            selectedModuleId === module.id
              ? "border-pine bg-white text-ink shadow-sm"
              : "border-ink/10 bg-canvas/70 text-ink/75 hover:bg-white"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Module {module.module_order}</p>
              <h4 className="mt-1 font-semibold">{module.title}</h4>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                module.is_completed ? "bg-pine/10 text-pine" : "bg-sand text-ink/70"
              )}
            >
              {module.is_completed ? "Terminé" : "À faire"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
