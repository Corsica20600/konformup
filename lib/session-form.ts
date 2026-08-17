import type { TrainingType } from "@/lib/database.types";
import { getTrainingDocumentTitle } from "@/lib/training-programs";
import type { TrainerOption } from "@/lib/types";

export function getDefaultTrainerId(trainers: TrainerOption[]) {
  return trainers[0]?.id ?? "";
}

export function getDefaultSessionTitle(trainingType: TrainingType) {
  return getTrainingDocumentTitle(trainingType, null);
}
