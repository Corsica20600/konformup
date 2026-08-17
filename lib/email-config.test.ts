import { describe, expect, it } from "vitest";
import { buildTransactionalEmailContext } from "@/lib/email-config";
import { PUBLIC_CONTACT_EMAIL, PUBLIC_ORGANIZATION_NAME } from "@/lib/public-config";
import type { OrganizationSettings } from "@/lib/types";

const organization: OrganizationSettings = {
  organization_name: PUBLIC_ORGANIZATION_NAME,
  address: "Adresse configuree en base",
  postal_code: null,
  city: null,
  country: null,
  siret: null,
  training_declaration_number: null,
  qualiopi_mention: null,
  legal_form: null,
  share_capital: null,
  vat_number: null,
  contact_email: PUBLIC_CONTACT_EMAIL,
  contact_phone: "0102030405",
  payment_terms: null,
  late_penalty_terms: null,
  collection_fee_terms: null,
  vat_exemption_text: null,
  logo_url: null,
  signature_url: null,
  certificate_signatory_name: "Responsable formation",
  certificate_signatory_title: "Formatrice"
};

describe("transactional email configuration", () => {
  it("uses the confirmed sender, reply-to and public signature", () => {
    const context = buildTransactionalEmailContext(organization, {
      BREVO_SENDER_EMAIL: PUBLIC_CONTACT_EMAIL,
      NEXT_PUBLIC_SITE_URL: "https://www.konformup.com"
    });

    expect(context.sender).toEqual({ email: PUBLIC_CONTACT_EMAIL, name: PUBLIC_ORGANIZATION_NAME });
    expect(context.replyTo).toEqual({ email: PUBLIC_CONTACT_EMAIL, name: PUBLIC_ORGANIZATION_NAME });
    expect(context.signatureLines).toContain(PUBLIC_CONTACT_EMAIL);
    expect(context.signatureLines).toContain("https://www.konformup.com");
    expect(context.signatureLines).not.toContain("https://app.konformup.com");
  });

  it("rejects an inconsistent configured Brevo sender", () => {
    expect(() =>
      buildTransactionalEmailContext(organization, {
        BREVO_SENDER_EMAIL: "another-sender@example.com"
      })
    ).toThrow(`BREVO_SENDER_EMAIL doit etre configure sur ${PUBLIC_CONTACT_EMAIL}.`);
  });
});
