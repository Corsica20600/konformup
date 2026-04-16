import { NextResponse } from "next/server";
import { getTrainerResourceBySlug } from "@/lib/trainer-resources";
import { generateTrainerResourcePdf } from "@/lib/trainer-resource-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resourceSlug: string }> }
) {
  const { resourceSlug } = await params;
  const resource = getTrainerResourceBySlug(resourceSlug);

  if (!resource) {
    return new NextResponse("Ressource introuvable.", { status: 404 });
  }

  try {
    const { bytes } = await generateTrainerResourcePdf(resource.slug);

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${resource.fileName}"`
      }
    });
  } catch (error) {
    console.error("[trainer-resource-pdf]", {
      resourceSlug,
      message: error instanceof Error ? error.message : String(error)
    });

    return new NextResponse("Impossible de generer le PDF formateur.", { status: 500 });
  }
}
