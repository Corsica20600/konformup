import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionById } from "@/lib/queries";
import { getOrganizationBranding } from "@/lib/organization";
import { AttendanceDocument } from "@/lib/pdf/documents";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const { session, candidates } = await getSessionById(sessionId);
  const organizationSettings = await getOrganizationBranding(new URL(request.url).origin);
  const document = createElement(AttendanceDocument as never, { session, candidates, organizationSettings });
  const buffer = await renderToBuffer(document as never);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="feuille-presence-${session.id}.pdf"`
    }
  });
}
