import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères.")
});

export const createSessionSchema = z.object({
  title: z.string().min(3, "Le titre est requis."),
  startDate: z.string().min(1, "La date de début est requise."),
  endDate: z.string().min(1, "La date de fin est requise."),
  location: z.string().min(2, "Le lieu est requis."),
  trainerName: z.string().optional().default(""),
  durationHours: z.coerce.number().positive("La durée doit être supérieure à 0.").optional(),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled"])
});

export const createCandidateSchema = z.object({
  sessionId: z.string().uuid().optional().or(z.literal("")),
  firstName: z.string().min(2, "Le prénom est requis."),
  lastName: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide.").or(z.literal("")),
  company: z.string().optional().default(""),
  companyId: z.string().uuid().or(z.literal("")),
  phone: z.string().optional().default(""),
  jobTitle: z.string().optional().default(""),
  address: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  city: z.string().optional().default(""),
  validationStatus: z.enum(["pending", "validated", "not_validated"]).default("pending")
});

export const createCompanyCandidateSchema = z.object({
  companyId: z.string().uuid("La société est requise."),
  sessionId: z.string().uuid().optional().or(z.literal("")),
  firstName: z.string().min(2, "Le prénom est requis."),
  lastName: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide.").or(z.literal("")),
  phone: z.string().optional().default(""),
  jobTitle: z.string().optional().default(""),
  address: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  city: z.string().optional().default(""),
  validationStatus: z.enum(["pending", "validated", "not_validated"]).default("pending")
});

export const updateCandidateSchema = z.object({
  candidateId: z.string().uuid(),
  sessionId: z.string().uuid(),
  firstName: z.string().min(2, "Le prénom est requis."),
  lastName: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide.").or(z.literal("")),
  company: z.string().optional().default(""),
  companyId: z.string().uuid().or(z.literal("")),
  phone: z.string().optional().default(""),
  jobTitle: z.string().optional().default(""),
  address: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  city: z.string().optional().default(""),
  validationStatus: z.enum(["pending", "validated", "not_validated"]).default("pending")
});

export const createCompanySchema = z.object({
  companyName: z.string().min(2, "Le nom de la société est requis."),
  contactFirstName: z.string().optional().default(""),
  contactLastName: z.string().optional().default(""),
  contactEmail: z.string().email("Email invalide.").or(z.literal("")),
  contactPhone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  siret: z.string().optional().default(""),
  notes: z.string().optional().default("")
});

export const updateCompanySchema = createCompanySchema.extend({
  companyId: z.string().uuid()
});

export const createQuoteSchema = z.object({
  sessionId: z.string().uuid().optional().or(z.literal("")),
  companyId: z.string().uuid("La société est requise."),
  title: z.string().trim().min(2, "L'intitulé est requis."),
  description: z.string().optional().default(""),
  candidateCount: z.coerce.number().int().min(0, "Le nombre de candidats doit être positif."),
  priceHt: z.coerce.number().min(0, "Le prix HT doit être positif."),
  vatRate: z.coerce.number().min(0, "Le taux de TVA doit être positif.").max(100, "Le taux de TVA semble invalide."),
  notes: z.string().optional().default("")
});

export const updateQuoteSchema = z
  .object({
    quoteId: z.string().uuid("Le devis est introuvable."),
    title: z.string().trim().min(2, "L'intitulé est requis."),
    description: z.string().optional().default(""),
    candidateCount: z.coerce.number().int().min(0, "Le nombre de candidats doit être positif."),
    sessionStartDate: z.string().optional().default(""),
    sessionEndDate: z.string().optional().default(""),
    location: z.string().optional().default(""),
    priceHt: z.coerce.number().min(0, "Le prix HT doit être positif."),
    vatRate: z.coerce.number().min(0, "Le taux de TVA doit être positif.").max(100, "Le taux de TVA semble invalide."),
    notes: z.string().optional().default("")
  })
  .refine(
    (data) => {
      if (!data.sessionStartDate || !data.sessionEndDate) {
        return true;
      }

      return data.sessionEndDate >= data.sessionStartDate;
    },
    {
      message: "La date de fin doit être postérieure ou égale à la date de début.",
      path: ["sessionEndDate"]
    }
  );
