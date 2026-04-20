import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { WelcomePackDocument } from "@/lib/pdf/welcome-pack";
import { getOrganizationBranding } from "@/lib/organization";
import { getSessionById, SessionNotFoundError } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DEFAULT_PROGRAMME_LINES = [
  "Role du SST dans l'entreprise et articulation avec la prevention des risques.",
  "Recherche des dangers persistants et protection adaptee des personnes exposees.",
  "Examen de la victime, alerte et organisation des secours.",
  "Gestes d'urgence face aux saignements, etouffements, malaises, brulures et traumatismes.",
  "Mises en situation pratiques, apprentissage de la PLS, RCP et utilisation du DEA."
];

export async function GET(request: Request, context: { params: Promise<{ candidateSessionId: string }> }) {
  const { candidateSessionId } = await context.params;
  const origin = new URL(request.url).origin;
  const supabase = await createClient();

  const { data: candidateRow, error } = await supabase
    .from("candidates")
    .select("id, session_id")
    .eq("id", candidateSessionId)
    .maybeSingle<{ id: string; session_id: string | null }>();

  if (error || !candidateRow?.session_id) {
    return NextResponse.json({ message: "Candidat ou session introuvable." }, { status: 404 });
  }

  try {
    const sessionData = await getSessionById(candidateRow.session_id);
    const candidateSession = sessionData.candidates.find((item) => item.candidate.id === candidateSessionId);

    if (!candidateSession) {
      return NextResponse.json({ message: "Candidat introuvable pour cette session." }, { status: 404 });
    }

    const organizationSettings = await getOrganizationBranding(origin);
    const programmeLines = sessionData.modules.length
      ? sessionData.modules.map((module) => module.title)
      : DEFAULT_PROGRAMME_LINES;

    const document = createElement(WelcomePackDocument as never, {
      session: sessionData.session,
      candidateSession,
      organizationSettings,
      programmeLines
    });
    const buffer = await renderToBuffer(document as never);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="welcome-pack-${candidateSessionId}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return NextResponse.json({ message: "Session introuvable." }, { status: 404 });
    }

    throw error;
  }
}
