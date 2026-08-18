import { z } from "zod";

const trainingTypeSchema = z.enum(["sst_initial", "mac_sst", "hygiene"]);
const candidateEvaluationTypeSchema = z.enum(["theorique", "pratique", "globale"]);
const candidateEvaluationStatusSchema = z.enum(["non_evalue", "en_cours", "acquis", "non_acquis", "absent"]);
const candidateEvaluationResultSchema = z.enum(["admis", "non_admis", "absent", "partiel", "non_renseigne"]);
const sessionClosureStatusSchema = z.enum(["ready", "closed"]);
const optionalFormStringSchema = z.preprocess((value) => value ?? "", z.string());

export const loginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères.")
});

export const createSessionSchema = z.object({
  title: z.string().min(3, "Le titre est requis."),
  startDate: z.string().min(1, "La date de début est requise."),
  endDate: z.string().min(1, "La date de fin est requise."),
  location: z.string().min(2, "Le lieu est requis."),
  trainerId: z.preprocess((value) => value ?? "", z.string().uuid().or(z.literal(""))),
  durationHours: z.coerce.number().positive("La durée doit être supérieure à 0.").optional(),
  trainingType: trainingTypeSchema.default("sst_initial"),
  prerequisites: z.string().optional().default(""),
  objectives: z.string().optional().default(""),
  programmeOutline: z.string().optional().default(""),
  accessibilityDetails: z.string().optional().default(""),
  macPreviousCertificateDate: optionalFormStringSchema,
  macPreviousCertificateRef: optionalFormStringSchema,
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled"])
});

export const updateSessionSchema = z
  .object({
    sessionId: z.string().uuid("La session est introuvable."),
    title: z.string().min(3, "Le titre est requis."),
    startDate: z.string().min(1, "La date de début est requise."),
    endDate: z.string().min(1, "La date de fin est requise."),
    location: z.string().min(2, "Le lieu est requis."),
    durationHours: z.union([z.literal(""), z.coerce.number().positive("La durée doit être supérieure à 0.")]).optional(),
    trainingType: trainingTypeSchema.default("sst_initial"),
    prerequisites: z.string().optional().default(""),
    objectives: z.string().optional().default(""),
    programmeOutline: z.string().optional().default(""),
    accessibilityDetails: z.string().optional().default(""),
    macPreviousCertificateDate: optionalFormStringSchema,
    macPreviousCertificateRef: optionalFormStringSchema,
    trainerId: z.string().uuid().or(z.literal("")).optional(),
    status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled"])
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure ou égale à la date de début.",
    path: ["endDate"]
  });

export const createCandidateSchema = z.object({
  sessionId: z.string().uuid().optional().or(z.literal("")),
  firstName: z.string().min(2, "Le prénom est requis."),
  lastName: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide.").or(z.literal("")),
  company: optionalFormStringSchema,
  companyId: z.string().uuid().or(z.literal("")),
  phone: optionalFormStringSchema,
  jobTitle: optionalFormStringSchema,
  address: optionalFormStringSchema,
  postalCode: optionalFormStringSchema,
  city: optionalFormStringSchema,
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

export const upsertCandidateEvaluationSchema = z.object({
  sessionId: z.string().uuid("La session est introuvable."),
  candidateId: z.string().uuid("Le candidat est introuvable."),
  evaluationType: candidateEvaluationTypeSchema.default("globale"),
  status: candidateEvaluationStatusSchema.default("non_evalue"),
  result: candidateEvaluationResultSchema.default("non_renseigne"),
  trainerNotes: z.string().optional().default(""),
  evaluatedAt: z.string().optional().default("")
});

export const updateSessionClosureSchema = z.object({
  sessionId: z.string().uuid("La session est introuvable."),
  closureStatus: sessionClosureStatusSchema.default("ready"),
  trainerReport: z.string().optional().default(""),
  administrativeObservations: z.string().optional().default("")
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

export const createTrainerSchema = z.object({
  firstName: z.string().min(2, "Le prenom est requis."),
  lastName: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide.").or(z.literal("")),
  phone: z.string().optional().default("")
});

export const createQuoteSchema = z
  .object({
    sessionId: z.string().uuid().optional().or(z.literal("")),
    companyId: z.string().uuid("La société est requise."),
    title: z.string().trim().min(2, "L'intitulé est requis."),
    description: z.string().optional().default(""),
    trainingType: trainingTypeSchema.default("sst_initial"),
    durationHours: z.coerce.number().positive("La durée doit être supérieure à 0.").optional(),
    prerequisites: z.string().optional().default(""),
    objectives: z.string().optional().default(""),
    programmeOutline: z.string().optional().default(""),
    accessibilityDetails: z.string().optional().default(""),
    macPreviousCertificateDate: optionalFormStringSchema,
    macPreviousCertificateRef: optionalFormStringSchema,
    candidateCount: z.coerce.number().int().min(0, "Le nombre de candidats doit être positif."),
    sessionStartDate: optionalFormStringSchema,
    sessionEndDate: optionalFormStringSchema,
    location: optionalFormStringSchema,
    trainerId: z.preprocess((value) => value ?? "", z.string().uuid().or(z.literal(""))),
    priceHt: z.coerce.number().min(0, "Le prix HT doit être positif."),
    vatRate: z.coerce.number().min(0, "Le taux de TVA doit être positif.").max(100, "Le taux de TVA semble invalide."),
    notes: z.string().optional().default("")
  })
  .superRefine((data, context) => {
    if (Boolean(data.sessionStartDate) !== Boolean(data.sessionEndDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Renseignez la date de début et la date de fin.",
        path: [data.sessionStartDate ? "sessionEndDate" : "sessionStartDate"]
      });
    } else if (data.sessionStartDate && data.sessionEndDate < data.sessionStartDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de fin doit être postérieure ou égale à la date de début.",
        path: ["sessionEndDate"]
      });
    }
  });

export const updateQuoteSchema = z
  .object({
    quoteId: z.string().uuid("Le devis est introuvable."),
    title: z.string().trim().min(2, "L'intitulé est requis."),
    description: z.string().optional().default(""),
    trainingType: trainingTypeSchema.default("sst_initial"),
    durationHours: z.union([z.literal(""), z.coerce.number().positive("La durée doit être supérieure à 0.")]).optional(),
    prerequisites: z.string().optional().default(""),
    objectives: z.string().optional().default(""),
    programmeOutline: z.string().optional().default(""),
    accessibilityDetails: z.string().optional().default(""),
    macPreviousCertificateDate: optionalFormStringSchema,
    macPreviousCertificateRef: optionalFormStringSchema,
    candidateCount: z.coerce.number().int().min(0, "Le nombre de candidats doit être positif."),
    sessionStartDate: z.string().optional().default(""),
    sessionEndDate: z.string().optional().default(""),
    location: z.string().optional().default(""),
    trainerId: z.preprocess((value) => value ?? "", z.string().uuid().or(z.literal(""))),
    currentTrainerName: optionalFormStringSchema,
    priceHt: z.coerce.number().min(0, "Le prix HT doit être positif."),
    vatRate: z.coerce.number().min(0, "Le taux de TVA doit être positif.").max(100, "Le taux de TVA semble invalide."),
    notes: z.string().optional().default("")
  })
  .superRefine((data, context) => {
    if (Boolean(data.sessionStartDate) !== Boolean(data.sessionEndDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Renseignez la date de début et la date de fin.",
        path: [data.sessionStartDate ? "sessionEndDate" : "sessionStartDate"]
      });
    } else if (data.sessionStartDate && data.sessionEndDate < data.sessionStartDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de fin doit être postérieure ou égale à la date de début.",
        path: ["sessionEndDate"]
      });
    }
  });

export const upsertInvoiceComplaintSchema = z.object({
  invoiceId: z.string().uuid("La facture est introuvable."),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  severity: z.enum(["low", "medium", "high"]),
  dissatisfactionSummary: z.string().optional().default(""),
  complaintDetails: z.string().optional().default(""),
  customerExpectation: z.string().optional().default(""),
  rootCause: z.string().optional().default(""),
  correctiveActions: z.string().optional().default(""),
  preventiveActions: z.string().optional().default(""),
  followUpActions: z.string().optional().default(""),
  internalNotes: z.string().optional().default(""),
  sendWithInvoice: z.boolean().default(false)
});
