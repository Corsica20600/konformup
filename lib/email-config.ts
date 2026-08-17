import { getOrganizationSettings } from "@/lib/organization";
import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_ORGANIZATION_NAME,
  resolvePublicSiteOrigin
} from "@/lib/public-config";
import type { OrganizationSettings } from "@/lib/types";

type EmailEnvironment = {
  [key: string]: string | undefined;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  ORGANIZATION_PHONE?: string;
  NEXT_PUBLIC_SITE_URL?: string;
};

export type TransactionalEmailContext = {
  organization: OrganizationSettings;
  sender: {
    email: string;
    name: string;
  };
  replyTo: {
    email: string;
    name: string;
  };
  signatureLines: string[];
};

type BrevoAttachment = {
  name: string;
  content: string;
};

type BrevoRecipient = {
  email: string;
  name?: string;
};

function requireBrevoApiKey(environment: EmailEnvironment) {
  const value = environment.BREVO_API_KEY?.trim();

  if (!value) {
    throw new Error("La variable d'environnement BREVO_API_KEY est requise pour envoyer un email.");
  }

  return value;
}

export function buildTransactionalEmailContext(
  organization: OrganizationSettings,
  environment: EmailEnvironment = process.env
): TransactionalEmailContext {
  const configuredSender = environment.BREVO_SENDER_EMAIL?.trim().toLowerCase();

  if (configuredSender && configuredSender !== PUBLIC_CONTACT_EMAIL) {
    throw new Error(`BREVO_SENDER_EMAIL doit etre configure sur ${PUBLIC_CONTACT_EMAIL}.`);
  }

  const signatoryName = organization.certificate_signatory_name?.trim();
  const phone = organization.contact_phone?.trim() || environment.ORGANIZATION_PHONE?.trim() || null;
  const signatureLines = [
    "Cordialement,",
    PUBLIC_ORGANIZATION_NAME,
    signatoryName && signatoryName !== organization.organization_name ? signatoryName : null,
    PUBLIC_CONTACT_EMAIL,
    phone,
    resolvePublicSiteOrigin(environment)
  ].filter((line): line is string => Boolean(line));

  return {
    organization,
    sender: {
      email: PUBLIC_CONTACT_EMAIL,
      name: PUBLIC_ORGANIZATION_NAME
    },
    replyTo: {
      email: PUBLIC_CONTACT_EMAIL,
      name: PUBLIC_ORGANIZATION_NAME
    },
    signatureLines
  };
}

export async function getTransactionalEmailContext() {
  const organization = await getOrganizationSettings();
  return buildTransactionalEmailContext(organization);
}

export async function sendBrevoTransactionalEmail({
  context,
  to,
  subject,
  textContent,
  attachment,
  errorLabel
}: {
  context: TransactionalEmailContext;
  to: BrevoRecipient[];
  subject: string;
  textContent: string;
  attachment?: BrevoAttachment[];
  errorLabel: string;
}) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": requireBrevoApiKey(process.env),
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: context.sender,
      replyTo: context.replyTo,
      to,
      subject,
      textContent,
      ...(attachment?.length ? { attachment } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`Brevo a refuse ${errorLabel}.`);
  }
}
