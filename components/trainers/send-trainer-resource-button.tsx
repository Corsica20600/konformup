"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendTrainerResourceEmailAction, type TrainerActionState } from "@/app/(dashboard)/trainers/actions";
import { Button } from "@/components/ui/button";
import { TRAINER_PEDAGOGICAL_RESOURCE_SLUG } from "@/lib/trainer-resources";

const initialState: TrainerActionState = {};

export function SendTrainerResourceButton({ trainerId }: { trainerId: string }) {
  const [state, formAction, pending] = useActionState(sendTrainerResourceEmailAction, initialState);

  return (
    <div className="flex flex-col items-start gap-1">
      <form action={formAction}>
        <input type="hidden" name="trainerId" value={trainerId} />
        <input type="hidden" name="resourceSlug" value={TRAINER_PEDAGOGICAL_RESOURCE_SLUG} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Envoi..." : "Envoyer le support"}
        </Button>
      </form>

      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? (
        <div className="flex flex-col items-start gap-1 text-sm text-pine">
          <p>{state.success}</p>
          {state.fileUrl ? (
            <Link href={state.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
