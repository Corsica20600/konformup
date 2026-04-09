"use client";

import { useActionState } from "react";
import { createTrainerAction, type TrainerActionState } from "@/app/(dashboard)/trainers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: TrainerActionState = {};

export function CreateTrainerForm() {
  const [state, formAction, pending] = useActionState(createTrainerAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <Input label="Prenom" name="firstName" required />
      <Input label="Nom" name="lastName" required />
      <Input label="Email" name="email" type="email" />
      <Input label="Telephone" name="phone" />
      {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creation..." : "Creer le formateur"}
        </Button>
      </div>
    </form>
  );
}
