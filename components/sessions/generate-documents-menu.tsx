"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { generateDocumentAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

const documentOptions = [
  { value: "attestation", label: "Attestation" },
  { value: "certificat", label: "Certificat" },
  { value: "convocation", label: "Convocation" }
] as const;

export function GenerateDocumentsMenu({
  sessionId,
  candidateId
}: {
  sessionId: string;
  candidateId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(generateDocumentAction, initialState);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state.success]);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative">
        <Button type="button" variant="secondary" onClick={() => setIsOpen((open) => !open)} disabled={pending}>
          {pending ? "Génération..." : "Générer documents"}
        </Button>

        {isOpen ? (
          <form
            action={formAction}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-10 grid min-w-[180px] gap-2 rounded-[24px] border border-ink/10 bg-white/95 p-3 shadow-panel"
          >
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="candidateId" value={candidateId} />
            {documentOptions.map((option) => (
              <button
                key={option.value}
                type="submit"
                name="type"
                value={option.value}
                className="rounded-2xl px-4 py-2 text-left text-sm font-semibold text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pending}
              >
                {option.label}
              </button>
            ))}
          </form>
        ) : null}
      </div>

      {state.error ? <p className="max-w-[240px] text-right text-sm text-accent">{state.error}</p> : null}

      {state.success ? (
        <div className="flex flex-col items-end gap-1">
          <p className="max-w-[240px] text-right text-sm text-pine">{state.success}</p>
          {state.fileUrl ? (
            <Link
              href={state.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-pine"
            >
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
