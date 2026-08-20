import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth";
import { createSessionArchiveSignedUrl } from "@/lib/session-archives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ archiveId: string }> }) {
  try {
    const { archiveId } = await params;
    const signedUrl = await createSessionArchiveSignedUrl(archiveId);
    return NextResponse.redirect(signedUrl, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    const status = error instanceof AuthenticationError ? 401 : 404;
    return NextResponse.json({ error: status === 401 ? "Authentification requise." : "Archive indisponible." }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
