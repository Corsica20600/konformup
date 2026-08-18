"use client";

import { useActionState } from "react";
import { updateTrainerAction, uploadTrainerDocumentAction, type TrainerActionState } from "@/app/(dashboard)/trainers/actions";
import { SendTrainerResourceButton } from "@/components/trainers/send-trainer-resource-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TrainerDocument, TrainerOption } from "@/lib/types";

const initialState: TrainerActionState = {};

function TrainerEditor({ trainer, documents }: { trainer: TrainerOption; documents: TrainerDocument[] }) {
  const [updateState, updateAction, updating] = useActionState(updateTrainerAction, initialState);
  const [uploadState, uploadAction, uploading] = useActionState(uploadTrainerDocumentAction, initialState);

  return (
    <Card className="transition hover:-translate-y-0.5 hover:bg-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold">{trainer.first_name} {trainer.last_name}</h3>
          <p className="text-sm text-ink/65">{trainer.email || "Email non renseigne"}</p>
          <p className="text-sm text-ink/55">{trainer.phone || "Telephone non renseigne"}</p>
        </div>
        <SendTrainerResourceButton trainerId={trainer.id} />
      </div>

      <details className="mt-5 border-t border-ink/10 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-pine">Modifier la fiche et les justificatifs</summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <form action={updateAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="trainerId" value={trainer.id} />
            <Input label="Prenom" name="firstName" defaultValue={trainer.first_name} required />
            <Input label="Nom" name="lastName" defaultValue={trainer.last_name} required />
            <Input label="Email" name="email" type="email" defaultValue={trainer.email ?? ""} />
            <Input label="Telephone" name="phone" defaultValue={trainer.phone ?? ""} />
            {updateState.error ? <p className="text-sm text-accent sm:col-span-2">{updateState.error}</p> : null}
            {updateState.success ? <p className="text-sm text-pine sm:col-span-2">{updateState.success}</p> : null}
            <div className="sm:col-span-2"><Button type="submit" disabled={updating}>{updating ? "Enregistrement..." : "Enregistrer"}</Button></div>
          </form>

          <div>
            <form action={uploadAction} className="grid gap-3">
              <input type="hidden" name="trainerId" value={trainer.id} />
              <Input label="Intitulé (facultatif)" name="label" placeholder="CV, certificat SST..." />
              <Input label="Document" name="file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
              <p className="text-xs text-ink/55">PDF, DOC ou DOCX · 10 Mo maximum</p>
              {uploadState.error ? <p className="text-sm text-accent">{uploadState.error}</p> : null}
              {uploadState.success ? <p className="text-sm text-pine">{uploadState.success}</p> : null}
              <div><Button type="submit" disabled={uploading}>{uploading ? "Envoi..." : "Ajouter le document"}</Button></div>
            </form>
            <div className="mt-5 grid gap-2">
              <p className="text-sm font-semibold">Documents enregistrés</p>
              {documents.length ? documents.map((document) => <a key={document.id} href={`/api/trainer-documents/${document.id}`} target="_blank" rel="noreferrer" className="text-sm text-pine underline underline-offset-4">{document.label} <span className="text-ink/50">— {document.file_name}</span></a>) : <p className="text-sm text-ink/55">Aucun document pour le moment.</p>}
            </div>
          </div>
        </div>
      </details>
    </Card>
  );
}

export function TrainerList({ trainers, documents }: { trainers: TrainerOption[]; documents: TrainerDocument[] }) {
  if (!trainers.length) return <Card><h3 className="text-lg font-bold">Aucun formateur</h3><p className="mt-2 text-sm text-ink/65">Cree un premier formateur pour pouvoir le rattacher aux sessions.</p></Card>;
  return <div className="grid gap-4">{trainers.map((trainer) => <TrainerEditor key={trainer.id} trainer={trainer} documents={documents.filter((document) => document.trainer_id === trainer.id)} />)}</div>;
}
