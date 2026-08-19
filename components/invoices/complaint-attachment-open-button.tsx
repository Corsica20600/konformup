"use client";
import { useActionState, useEffect } from "react";
import { openInvoiceComplaintAttachmentAction } from "@/app/(dashboard)/invoices/actions";
import { Button } from "@/components/ui/button";
export function ComplaintAttachmentOpenButton({ attachmentId }: { attachmentId: string }) { const [state, action, pending] = useActionState(openInvoiceComplaintAttachmentAction, {}); useEffect(() => { if (state.url) window.open(state.url, "_blank", "noopener,noreferrer"); }, [state.url]); return <form action={action} className="inline"><input type="hidden" name="attachmentId" value={attachmentId} /><Button type="submit" disabled={pending}>{pending ? "Ouverture…" : "Ouvrir"}</Button>{state.error ? <span className="ml-2 text-xs text-accent">{state.error}</span> : null}</form>; }
