import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getInvoiceById: vi.fn(),
  getInvoiceStatusAfterSend: vi.fn(),
  setInvoiceCompanySatisfaction: vi.fn(),
  updateInvoiceStatus: vi.fn(),
  sendInvoiceEmail: vi.fn(),
  setInvoiceComplaintSendWithInvoice: vi.fn(),
  revalidatePath: vi.fn(), uploadComplaintAttachment: vi.fn(), createComplaintAttachmentSignedUrl: vi.fn()
}));

vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/invoices", () => ({
  getInvoiceById: mocks.getInvoiceById,
  getInvoiceStatusAfterSend: mocks.getInvoiceStatusAfterSend,
  setInvoiceCompanySatisfaction: mocks.setInvoiceCompanySatisfaction,
  updateInvoiceStatus: mocks.updateInvoiceStatus
}));
vi.mock("@/lib/invoice-email", () => ({ sendInvoiceEmail: mocks.sendInvoiceEmail }));
vi.mock("@/lib/invoice-complaints", () => ({ setInvoiceComplaintSendWithInvoice: mocks.setInvoiceComplaintSendWithInvoice }));
vi.mock("@/lib/complaint-attachments", () => ({ uploadComplaintAttachment: mocks.uploadComplaintAttachment, createComplaintAttachmentSignedUrl: mocks.createComplaintAttachmentSignedUrl }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { sendInvoiceEmailAction } from "@/app/(dashboard)/invoices/actions";

const invoice = {
  id: "invoice-1",
  status: "draft",
  company: { id: "company-1" },
  quote: { id: "quote-1" }
} as never;

function formData(...values: string[]) {
  const data = new FormData();
  data.set("invoiceId", "invoice-1");
  values.forEach((value) => data.append("sendWithInvoice", value));
  return data;
}

describe("sendInvoiceEmailAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1" });
    mocks.getInvoiceById.mockResolvedValue(invoice);
    mocks.getInvoiceStatusAfterSend.mockReturnValue("sent");
    mocks.sendInvoiceEmail.mockResolvedValue({ fileUrl: "/api/pdf/invoice/invoice-1", complaintAttached: false });
  });

  it("persists the enabled option immediately before sending", async () => {
    const calls: string[] = [];
    mocks.setInvoiceComplaintSendWithInvoice.mockImplementation(async () => calls.push("save"));
    mocks.sendInvoiceEmail.mockImplementation(async () => {
      calls.push("email");
      return { fileUrl: "/invoice.pdf", complaintAttached: true };
    });

    const result = await sendInvoiceEmailAction({}, formData("false", "true"));

    expect(mocks.setInvoiceComplaintSendWithInvoice).toHaveBeenCalledWith(invoice, true);
    expect(calls).toEqual(["save", "email"]);
    expect(result.success).toBe("Facture et fiche de réclamation envoyées.");
  });

  it("persists an explicit disabled option", async () => {
    await sendInvoiceEmailAction({}, formData("false"));
    expect(mocks.setInvoiceComplaintSendWithInvoice).toHaveBeenCalledWith(invoice, false);
  });

  it("does not send when persisting the selected option fails", async () => {
    mocks.setInvoiceComplaintSendWithInvoice.mockRejectedValue(new Error("Sauvegarde impossible"));

    const result = await sendInvoiceEmailAction({}, formData("true"));

    expect(result).toEqual({ error: "Sauvegarde impossible" });
    expect(mocks.sendInvoiceEmail).not.toHaveBeenCalled();
  });
});
