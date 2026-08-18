import type { TrainingType } from "@/lib/database.types";
import { getTrainingDocumentTitle } from "@/lib/training-programs";
import type { TrainerOption } from "@/lib/types";

export function getDefaultTrainerId(trainers: TrainerOption[]) {
  return trainers[0]?.id ?? "";
}

export function getAssignedTrainerFallback(
  trainerId: string | null,
  trainerName: string | null,
  trainers: TrainerOption[]
) {
  if (!trainerId || trainers.some((trainer) => trainer.id === trainerId)) {
    return null;
  }

  return {
    id: trainerId,
    label: trainerName?.trim() || "Formateur actuellement rattaché"
  };
}

export function getDefaultSessionTitle(trainingType: TrainingType) {
  return getTrainingDocumentTitle(trainingType, null);
}
