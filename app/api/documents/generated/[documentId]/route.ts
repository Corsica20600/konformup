import { NextResponse } from "next/server";
import { downloadStoredGeneratedDocument } from "@/lib/document-storage";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;

  try {
    const { buffer, fileName } = await downloadStoredGeneratedDocument(documentId);
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${fileName}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Impossible d'ouvrir ce document."
      },
      { status: 404 }
    );
  }
}
