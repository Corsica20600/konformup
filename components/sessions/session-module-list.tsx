import Link from "next/link";
import type { SessionModuleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SessionModuleList({
  sessionId,
  moduleGroups,
  selectedModuleId
}: {
  sessionId: string;
  moduleGroups: SessionModuleGroup[];
  selectedModuleId: string;
}) {
  return (
    <div className="grid gap-2">
      {moduleGroups.map(({ parent, children }) => {
        const hasChildren = children.length > 0;
        const completedChildren = children.filter((child) => child.is_completed).length;
        const parentCompleted = hasChildren ? completedChildren === children.length : parent.is_completed;

        return (
          <div key={parent.id} className="grid gap-2">
            <Link
              href={`/sessions/${sessionId}?module=${parent.id}`}
              className={cn(
                "rounded-2xl border px-4 py-3 transition",
                selectedModuleId === parent.id
                  ? "border-pine bg-white text-ink shadow-sm"
                  : "border-ink/10 bg-canvas/70 text-ink/80 hover:bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Module {parent.module_order}</p>
                  <h4 className="mt-1 font-semibold">{parent.title}</h4>
                  {parent.summary ? <p className="mt-1 text-sm text-ink/60">{parent.summary}</p> : null}
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    parentCompleted ? "bg-pine/10 text-pine" : "bg-sand text-ink/70"
                  )}
                >
                  {hasChildren ? `${completedChildren}/${children.length}` : parentCompleted ? "Terminé" : "À faire"}
                </span>
              </div>
            </Link>

            {hasChildren ? (
              <div className="ml-4 grid gap-2 border-l border-ink/10 pl-4">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/sessions/${sessionId}?module=${child.id}`}
                    className={cn(
                      "rounded-2xl border px-4 py-3 transition",
                      selectedModuleId === child.id
                        ? "border-pine bg-white text-ink shadow-sm"
                        : "border-ink/10 bg-white/80 text-ink/75 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-ink/40">Sous-module {child.module_order}</p>
                        <h5 className="mt-1 font-semibold">{child.title}</h5>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          child.is_completed ? "bg-pine/10 text-pine" : "bg-sand text-ink/70"
                        )}
                      >
                        {child.is_completed ? "Terminé" : "À faire"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
