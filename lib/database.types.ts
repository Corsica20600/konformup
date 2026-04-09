export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TrainingSessionStatus = "draft" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type CandidateValidationStatus = "pending" | "validated" | "not_validated";
export type GeneratedDocumentStatus = "draft" | "generated" | "sent" | "signed" | "archived";
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "archived";

export type Database = {
  public: {
    Tables: {
      training_sessions: {
        Row: {
          id: string;
          title: string;
          start_date: string;
          end_date: string;
          location: string;
          status: TrainingSessionStatus;
          trainer_user_id: string | null;
          trainer_name: string | null;
          duration_hours: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          start_date: string;
          end_date: string;
          location: string;
          status?: TrainingSessionStatus;
          trainer_user_id?: string | null;
          trainer_name?: string | null;
          duration_hours?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_date?: string;
          end_date?: string;
          location?: string;
          status?: TrainingSessionStatus;
          trainer_user_id?: string | null;
          trainer_name?: string | null;
          duration_hours?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          id: string;
          session_id: string | null;
          company_id: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          company: string | null;
          phone: string | null;
          job_title: string | null;
          address: string | null;
          postal_code: string | null;
          city: string | null;
          validation_status: CandidateValidationStatus;
          validated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          company_id?: string | null;
          first_name: string;
          last_name: string;
          email?: string | null;
          company?: string | null;
          phone?: string | null;
          job_title?: string | null;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          validation_status?: CandidateValidationStatus;
          validated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          company_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          company?: string | null;
          phone?: string | null;
          job_title?: string | null;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          validation_status?: CandidateValidationStatus;
          validated_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidates_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidates_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "client_companies";
            referencedColumns: ["id"];
          }
        ];
      };
      client_companies: {
        Row: {
          id: string;
          company_name: string;
          legal_name: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          billing_address: string | null;
          postal_code: string | null;
          city: string | null;
          siret: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          legal_name?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          billing_address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          siret?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          legal_name?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          billing_address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          siret?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      generated_documents: {
        Row: {
          id: string;
          session_id: string | null;
          candidate_id: string | null;
          company_id: string | null;
          document_type: string;
          document_ref: string;
          version: number;
          status: GeneratedDocumentStatus;
          file_url: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          candidate_id?: string | null;
          company_id?: string | null;
          document_type: string;
          document_ref: string;
          version?: number;
          status?: GeneratedDocumentStatus;
          file_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          candidate_id?: string | null;
          company_id?: string | null;
          document_type?: string;
          document_ref?: string;
          version?: number;
          status?: GeneratedDocumentStatus;
          file_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_documents_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "client_companies";
            referencedColumns: ["id"];
          }
        ];
      };
      quotes: {
        Row: {
          id: string;
          quote_number: string;
          status: QuoteStatus;
          session_id: string | null;
          company_id: string;
          title: string;
          description: string | null;
          candidate_count: number;
          session_start_date: string | null;
          session_end_date: string | null;
          location: string | null;
          price_ht: number;
          vat_rate: number;
          total_ttc: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_number: string;
          status?: QuoteStatus;
          session_id?: string | null;
          company_id: string;
          title: string;
          description?: string | null;
          candidate_count?: number;
          session_start_date?: string | null;
          session_end_date?: string | null;
          location?: string | null;
          price_ht: number;
          vat_rate?: number;
          total_ttc?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_number?: string;
          status?: QuoteStatus;
          session_id?: string | null;
          company_id?: string;
          title?: string;
          description?: string | null;
          candidate_count?: number;
          session_start_date?: string | null;
          session_end_date?: string | null;
          location?: string | null;
          price_ht?: number;
          vat_rate?: number;
          total_ttc?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "client_companies";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_settings: {
        Row: {
          id: string;
          organization_name: string;
          address: string;
          siret: string | null;
          training_declaration_number: string | null;
          qualiopi_mention: string | null;
          logo_url: string | null;
          signature_url: string | null;
          certificate_signatory_name: string | null;
          certificate_signatory_title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_name: string;
          address: string;
          siret?: string | null;
          training_declaration_number?: string | null;
          qualiopi_mention?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          certificate_signatory_name?: string | null;
          certificate_signatory_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_name?: string;
          address?: string;
          siret?: string | null;
          training_declaration_number?: string | null;
          qualiopi_mention?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          certificate_signatory_name?: string | null;
          certificate_signatory_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_modules: {
        Row: {
          id: string;
          session_id: string;
          title: string;
          summary: string | null;
          module_order: number;
          estimated_minutes: number | null;
          content_text: string | null;
          video_url: string | null;
          pdf_url: string | null;
          trainer_guidance: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          title: string;
          summary?: string | null;
          module_order: number;
          estimated_minutes?: number | null;
          content_text?: string | null;
          video_url?: string | null;
          pdf_url?: string | null;
          trainer_guidance?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          title?: string;
          summary?: string | null;
          module_order?: number;
          estimated_minutes?: number | null;
          content_text?: string | null;
          video_url?: string | null;
          pdf_url?: string | null;
          trainer_guidance?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_modules_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      session_module_progress: {
        Row: {
          id: string;
          session_id: string;
          module_id: string;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          module_id: string;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          module_id?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_module_progress_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_module_progress_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "training_modules";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      training_session_status: TrainingSessionStatus;
      candidate_validation_status: CandidateValidationStatus;
      quote_status: QuoteStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
