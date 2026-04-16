export const TRAINER_PEDAGOGICAL_RESOURCE_SLUG = "deroule-pedagogique-sst" as const;

export type TrainerResourceSlug = typeof TRAINER_PEDAGOGICAL_RESOURCE_SLUG;

export type TrainerResourceDefinition = {
  slug: TrainerResourceSlug;
  title: string;
  description: string;
  fileName: string;
  apiPath: string;
};

export const TRAINER_PEDAGOGICAL_RESOURCE: TrainerResourceDefinition = {
  slug: TRAINER_PEDAGOGICAL_RESOURCE_SLUG,
  title: "Deroule pedagogique SST",
  description: "Version Konformup du support pedagogique a disposition des formateurs.",
  fileName: "deroule-pedagogique-sst-konformup.pdf",
  apiPath: `/api/pdf/trainer-resource/${TRAINER_PEDAGOGICAL_RESOURCE_SLUG}`
};

export function getTrainerResourceBySlug(slug: string): TrainerResourceDefinition | null {
  if (slug === TRAINER_PEDAGOGICAL_RESOURCE_SLUG) {
    return TRAINER_PEDAGOGICAL_RESOURCE;
  }

  return null;
}
