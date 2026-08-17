import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { accessErrorResponse } from "@/lib/api-errors";
import { assertCanAccessSession } from "@/lib/auth";
import { getOrganizationBranding } from "@/lib/organization";
import { SessionReportDocument } from "@/lib/pdf/final-documents";
import { getSessionById, SessionNotFoundError } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const origin = new URL(request.url).origin;

  try {
    await assertCanAccessSession(sessionId);
  } catch (error) {
    const accessResponse = accessErrorResponse(error);
    if (accessResponse) {
      return accessResponse;
    }

    return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
  }

  try {
    const sessionData = await getSessionById(sessionId);
    const organizationSettings = await getOrganizationBranding(origin);
    const document = createElement(SessionReportDocument as never, {
      session: sessionData.session,
      candidates: sessionData.candidates,
      organizationSettings
    });
    const buffer = await renderToBuffer(document as never);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bilan-session-${sessionId}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return NextResponse.json({ message: "Session introuvable." }, { status: 404 });
    }

    throw error;
  }
}
