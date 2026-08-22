import "server-only";

export const DUERP_KONFORMUP_SUPPORT_SLUG = "duerp-konformup" as const;

type PedagogicalSupport = {
  slug: typeof DUERP_KONFORMUP_SUPPORT_SLUG;
  fileName: string;
  storageBucket: "shared-training-resources";
  storagePath: string;
};

const supports: Record<typeof DUERP_KONFORMUP_SUPPORT_SLUG, PedagogicalSupport> = {
  [DUERP_KONFORMUP_SUPPORT_SLUG]: {
    slug: DUERP_KONFORMUP_SUPPORT_SLUG,
    fileName: "DUERP_Konformup.pdf",
    storageBucket: "shared-training-resources",
    storagePath: "pedagogical-supports/duerp-konformup/v1.pdf"
  }
};

export function getPedagogicalSupport(slug: string): PedagogicalSupport | null {
  return supports[slug as keyof typeof supports] ?? null;
}

export function getPedagogicalSupportUrl(slug: typeof DUERP_KONFORMUP_SUPPORT_SLUG) {
  return `/api/training-supports/${slug}`;
}
