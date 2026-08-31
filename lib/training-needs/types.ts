export const trainingNeedsTrainingTypes = ["sst_initial", "mac_sst", "hygiene"] as const;
export type TrainingNeedsTrainingType = (typeof trainingNeedsTrainingTypes)[number];

export const trainingNeedsAnalysisStatuses = ["draft", "sent", "in_progress", "completed", "cancelled"] as const;
export type TrainingNeedsAnalysisStatus = (typeof trainingNeedsAnalysisStatuses)[number];

export type TrainingNeedsRespondent = { name: string; firstName: string; role: string; email: string; phone: string };

export type TrainingNeedsCommonAnswers = {
  respondent: TrainingNeedsRespondent;
  objectives: string;
  participantCount: number;
  participantProfiles: string[];
  accessibilityNeeds: string;
  constraints: string;
  preferredDates: string;
  notes: string;
  companyWorkforce: number;
  businessSector: string;
  desiredLocation: string;
  requestOrigins: Array<"regulatory" | "initial_training" | "skills_maintenance" | "risk_prevention" | "management_request" | "employee_request" | "activity_change" | "accident_incident" | "audit" | "other">;
  requestOriginOther: string;
  requestReasons: string;
  experienceLevel: "new" | "experienced" | "mixed";
  frenchLevel: "yes" | "no" | "to_check";
  learningAdaptations: string;
  accessibilityStatus: "no" | "yes" | "unknown";
  accessibilityAdaptations: string;
  scheduleConstraints: string;
  siteAccessConstraints: string;
  requiredPpe: string;
  roomAvailable: "yes" | "no" | "to_check";
  workplaceVisitPossible: "yes" | "no" | "to_check";
  activityDescription: string;
  concernedWorkstations: string;
  identifiedRisks: string;
  recentIncidents: string;
  internalDocuments: Array<"duerp" | "safety_instructions" | "prevention_plan" | "emergency_procedures" | "site_plan" | "sanitary_plan" | "hygiene_protocols" | "other" | "none">;
  internalDocumentsOther: string;
  previousSimilarTraining: "yes" | "no" | "unknown";
  previousTrainingTitle: string;
  previousTrainingDate: string;
};

export type TrainingNeedsSstInitialAnswers = { firstAidExperience: "none" | "occasional" | "regular"; currentSstEmployees: "yes" | "no" | "unknown"; currentSstCount: number; coverageAreas: string; workplaceRisks: Array<"falls" | "manual_handling" | "machines" | "electricity" | "chemical" | "burns" | "cuts" | "choking" | "malaise" | "traffic" | "isolated_work" | "public" | "other">; workplaceRisksOther: string; exerciseSituations: string; preventionAndFirstAidExpectations: string; emergencyEquipment: Array<"first_aid_kit" | "defibrillator" | "eyewash" | "none" | "other">; };
export type TrainingNeedsMacSstAnswers = { certificateHolderCount: number; lastTrainingDate: string; certificatesAvailable: "yes" | "no" | "to_check"; certificateStatus: "valid" | "expired" | "unknown" | "mixed"; certificateReference: string; changesSinceTraining: Array<"premises" | "equipment" | "risks" | "organisation" | "emergency_procedures" | "accident_incident" | "none" | "other">; changesOther: string; practiceNeeds: Array<"protection" | "prevention" | "examination" | "alert" | "bleeding" | "choking" | "malaise" | "burn" | "trauma" | "unconsciousness" | "cardiac_defibrillator" | "company_situations">; observations: string; };
export type TrainingNeedsHygieneAnswers = { sector: "food_service" | "retail" | "healthcare" | "industry" | "other"; sectorOther: string; establishmentType: string; participantActivities: Array<"receiving" | "storage" | "preparation" | "processing" | "cooking" | "cooling" | "reheating" | "service" | "sales" | "delivery" | "cleaning" | "waste" | "traceability" | "other">; activitiesOther: string; sanitaryPlan: "yes" | "no" | "to_check"; hygieneProcedures: string; hygieneRisks: Array<"staff_hygiene" | "hand_washing" | "professional_attire" | "cleaning" | "temperatures" | "cold_chain" | "storage" | "expiry_dates" | "cross_contamination" | "allergens" | "traceability" | "waste" | "pests" | "documentation" | "other">; hygieneRisksOther: string; recentInspection: "yes" | "no" | "unknown"; inspectionRequests: string; priorityObjectives: string; };
export type TrainingNeedsAnswers =
  | (TrainingNeedsCommonAnswers & { trainingType: "sst_initial"; specific: TrainingNeedsSstInitialAnswers })
  | (TrainingNeedsCommonAnswers & { trainingType: "mac_sst"; specific: TrainingNeedsMacSstAnswers })
  | (TrainingNeedsCommonAnswers & { trainingType: "hygiene"; specific: TrainingNeedsHygieneAnswers });

export type TrainingNeedsQuoteSnapshot = {
  quoteNumber: string; title: string; companyName: string; candidateCount: number;
  sessionStartDate: string | null; sessionEndDate: string | null; location: string | null;
};
export type TrainingNeedsProgress = { currentStep: number; progressPercent: number };
export type TrainingNeedsAnalysis = {
  id: string; companyId: string; quoteId: string | null; trainingType: TrainingNeedsTrainingType; status: TrainingNeedsAnalysisStatus;
  answers: TrainingNeedsAnswers | Record<string, never>; respondent: TrainingNeedsRespondent | null; questionnaireVersion: "1";
  quoteSnapshot: TrainingNeedsQuoteSnapshot; progress: TrainingNeedsProgress; firstOpenedAt: string | null;
  lastSavedAt: string | null; completedAt: string | null; tokenExpiresAt: string | null; createdAt: string; updatedAt: string;
};
export type PublicTrainingNeedsAnalysisView = {
  id: string; trainingType: TrainingNeedsTrainingType; status: Extract<TrainingNeedsAnalysisStatus, "sent" | "in_progress">;
  questionnaireVersion: "1"; quote: Pick<TrainingNeedsQuoteSnapshot, "quoteNumber" | "title" | "companyName" | "sessionStartDate" | "sessionEndDate" | "location">;
  progress: TrainingNeedsProgress; answers: Partial<Omit<TrainingNeedsAnswers, "trainingType">>; tokenExpiresAt: string | null; isReadOnly: boolean;
};
export type InternalTrainingNeedsAnalysisView = TrainingNeedsAnalysis & { tokenHash: string; createdBy: string | null };
