import { QualiopiWatchWorkspace } from "@/components/quality-watch/qualiopi-watch-workspace";
import { requireUser } from "@/lib/auth";
import { getQualiopiWatchEntries } from "@/lib/qualiopi-watch";

export const dynamic = "force-dynamic";
export default async function QualityWatchPage() { await requireUser(); const entries = await getQualiopiWatchEntries(); return <QualiopiWatchWorkspace entries={entries} />; }
