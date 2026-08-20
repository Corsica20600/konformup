import { NextResponse } from "next/server";
import { accessErrorResponse } from "@/lib/api-errors";
import { assertCanAccessGeneratedDocument } from "@/lib/auth";
import { downloadStoredGeneratedDocument } from "@/lib/document-storage";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;

  try {
    await assertCanAccessGeneratedDocument(documentId);
    const { buffer, fileName } = await downloadStoredGeneratedDocument(documentId);
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache"
      }
    });
  } catch (error) {
    const accessResponse = accessErrorResponse(error);
    if (accessResponse) {
      return accessResponse;
    }

    return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
  }
}
