import { NextResponse } from "next/server";
import { accessErrorResponse } from "@/lib/api-errors";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPedagogicalSupport } from "@/lib/pedagogical-supports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ supportSlug: string }> }
) {
  const { supportSlug } = await params;
  const support = getPedagogicalSupport(supportSlug);

  if (!support) {
    return new NextResponse("Support introuvable.", { status: 404 });
  }

  try {
    await requireAuthenticatedUser();
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from(support.storageBucket).download(support.storagePath);

    if (error || !data) {
      return new NextResponse("Support indisponible.", { status: 404 });
    }

    return new NextResponse(Buffer.from(await data.arrayBuffer()), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${support.fileName}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    const accessResponse = accessErrorResponse(error);
    if (accessResponse) {
      return accessResponse;
    }

    return new NextResponse("Support indisponible.", { status: 500 });
  }
}
