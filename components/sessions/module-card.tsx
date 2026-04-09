import { SST_MODULES, type SstModule } from "@/lib/constants/sst-modules";
import { Card } from "@/components/ui/card";

export function ModuleLibrary() {
  return (
    <div className="grid gap-4">
      {SST_MODULES.map((module) => (
        <ModulePreview key={module.key} module={module} />
      ))}
    </div>
  );
}

function ModulePreview({ module }: { module: SstModule }) {
  return (
    <Card className="border border-ink/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink/45">Module {module.order}</p>
          <h3 className="mt-2 text-lg font-bold">{module.title}</h3>
          <p className="mt-2 text-sm text-ink/65">{module.description}</p>
          <p className="mt-4 text-sm leading-6 text-ink/80">{module.textContent}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-pine">
        <a href={module.videoUrl} target="_blank" rel="noreferrer">
          Voir la vidéo
        </a>
        <a href={module.pdfUrl} target="_blank" rel="noreferrer">
          Ouvrir le PDF
        </a>
      </div>
    </Card>
  );
}
