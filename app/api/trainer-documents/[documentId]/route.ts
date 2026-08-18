import { NextResponse } from "next/server";
import { accessErrorResponse } from "@/lib/api-errors";
import { requireAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await context.params;
    const { supabase } = await requireAuthenticatedUser();
    const { data: document, error } = await supabase
      .from("trainer_documents")
      .select("file_name, mime_type, storage_path")
      .eq("id", documentId)
      .maybeSingle();

    if (error || !document) return NextResponse.json({ message: "Document introuvable." }, { status: 404 });

    const { data: file, error: downloadError } = await supabase.storage.from("trainer-documents").download(document.storage_path);
    if (downloadError) return NextResponse.json({ message: "Document indisponible." }, { status: 404 });

    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
    return new NextResponse(Buffer.from(await file.arrayBuffer()), {
      headers: {
        "Content-Type": document.mime_type,
        "Content-Disposition": `${disposition}; filename="${document.file_name.replace(/[\"\\]/g, "")}"`
      }
    });
  } catch (error) {
    return accessErrorResponse(error) ?? NextResponse.json({ message: "Document introuvable." }, { status: 404 });
  }
}
