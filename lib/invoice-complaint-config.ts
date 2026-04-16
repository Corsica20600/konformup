export const INVOICE_COMPLAINT_STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;
export const INVOICE_COMPLAINT_SEVERITY_OPTIONS = ["low", "medium", "high"] as const;

export type InvoiceComplaintStatus = (typeof INVOICE_COMPLAINT_STATUS_OPTIONS)[number];
export type InvoiceComplaintSeverity = (typeof INVOICE_COMPLAINT_SEVERITY_OPTIONS)[number];
