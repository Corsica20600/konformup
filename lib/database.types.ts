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
export type AttendanceSlotStatus = "draft" | "sent" | "open" | "closed";
export type AttendanceDeliveryChannel = "email" | "sms";
export type AttendanceDeliveryStatus = "pending" | "sent" | "failed";
export type AttendanceResponseStatus = "pending" | "present" | "absent" | "issue";

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
          source_quote_id: string | null;
          trainer_id: string | null;
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
          source_quote_id?: string | null;
          trainer_id?: string | null;
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
          source_quote_id?: string | null;
          trainer_id?: string | null;
          trainer_user_id?: string | null;
          trainer_name?: string | null;
          duration_hours?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_sessions_trainer_id_fkey";
            columns: ["trainer_id"];
            referencedRelation: "trainers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_sessions_source_quote_id_fkey";
            columns: ["source_quote_id"];
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          }
        ];
      };
      trainers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
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
      attendance_slots: {
        Row: {
          id: string;
          session_id: string;
          slot_label: string;
          slot_date: string;
          period: "morning" | "afternoon" | "custom";
          starts_at: string | null;
          ends_at: string | null;
          status: AttendanceSlotStatus;
          sent_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          slot_label: string;
          slot_date: string;
          period?: "morning" | "afternoon" | "custom";
          starts_at?: string | null;
          ends_at?: string | null;
          status?: AttendanceSlotStatus;
          sent_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          slot_label?: string;
          slot_date?: string;
          period?: "morning" | "afternoon" | "custom";
          starts_at?: string | null;
          ends_at?: string | null;
          status?: AttendanceSlotStatus;
          sent_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_slots_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance_responses: {
        Row: {
          id: string;
          attendance_slot_id: string;
          candidate_id: string;
          response_token: string;
          delivery_channel: AttendanceDeliveryChannel;
          delivery_sent_at: string | null;
          delivery_status: AttendanceDeliveryStatus;
          responded_at: string | null;
          response_status: AttendanceResponseStatus;
          trainer_override_status: AttendanceResponseStatus | null;
          trainer_overridden_at: string | null;
          trainer_override_note: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attendance_slot_id: string;
          candidate_id: string;
          response_token: string;
          delivery_channel?: AttendanceDeliveryChannel;
          delivery_sent_at?: string | null;
          delivery_status?: AttendanceDeliveryStatus;
          responded_at?: string | null;
          response_status?: AttendanceResponseStatus;
          trainer_override_status?: AttendanceResponseStatus | null;
          trainer_overridden_at?: string | null;
          trainer_override_note?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          attendance_slot_id?: string;
          candidate_id?: string;
          response_token?: string;
          delivery_channel?: AttendanceDeliveryChannel;
          delivery_sent_at?: string | null;
          delivery_status?: AttendanceDeliveryStatus;
          responded_at?: string | null;
          response_status?: AttendanceResponseStatus;
          trainer_override_status?: AttendanceResponseStatus | null;
          trainer_overridden_at?: string | null;
          trainer_override_note?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_responses_attendance_slot_id_fkey";
            columns: ["attendance_slot_id"];
            referencedRelation: "attendance_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_responses_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
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
      invoices: {
        Row: {
          id: string;
          invoice_number: string | null;
          quote_id: string;
          company_id: string;
          status: string;
          issue_date: string | null;
          due_date: string | null;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total_ttc: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string | null;
          quote_id: string;
          company_id: string;
          status?: string;
          issue_date?: string | null;
          due_date?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_ttc?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string | null;
          quote_id?: string;
          company_id?: string;
          status?: string;
          issue_date?: string | null;
          due_date?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_ttc?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_quote_id_fkey";
            columns: ["quote_id"];
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "client_companies";
            referencedColumns: ["id"];
          }
        ];
      };
      invoice_complaints: {
        Row: {
          id: string;
          invoice_id: string;
          company_id: string;
          quote_id: string;
          status: string;
          severity: string;
          dissatisfaction_summary: string;
          complaint_details: string;
          customer_expectation: string;
          root_cause: string;
          corrective_actions: string;
          preventive_actions: string;
          follow_up_actions: string;
          internal_notes: string;
          send_with_invoice: boolean;
          sent_with_invoice_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          company_id: string;
          quote_id: string;
          status?: string;
          severity?: string;
          dissatisfaction_summary?: string;
          complaint_details?: string;
          customer_expectation?: string;
          root_cause?: string;
          corrective_actions?: string;
          preventive_actions?: string;
          follow_up_actions?: string;
          internal_notes?: string;
          send_with_invoice?: boolean;
          sent_with_invoice_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          company_id?: string;
          quote_id?: string;
          status?: string;
          severity?: string;
          dissatisfaction_summary?: string;
          complaint_details?: string;
          customer_expectation?: string;
          root_cause?: string;
          corrective_actions?: string;
          preventive_actions?: string;
          follow_up_actions?: string;
          internal_notes?: string;
          send_with_invoice?: boolean;
          sent_with_invoice_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_complaints_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_complaints_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "client_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_complaints_quote_id_fkey";
            columns: ["quote_id"];
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_settings: {
        Row: {
          id: string;
          organization_name: string;
          address: string;
          postal_code: string | null;
          city: string | null;
          country: string | null;
          siret: string | null;
          training_declaration_number: string | null;
          qualiopi_mention: string | null;
          legal_form: string | null;
          share_capital: string | null;
          vat_number: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          payment_terms: string | null;
          late_penalty_terms: string | null;
          collection_fee_terms: string | null;
          vat_exemption_text: string | null;
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
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          siret?: string | null;
          training_declaration_number?: string | null;
          qualiopi_mention?: string | null;
          legal_form?: string | null;
          share_capital?: string | null;
          vat_number?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          payment_terms?: string | null;
          late_penalty_terms?: string | null;
          collection_fee_terms?: string | null;
          vat_exemption_text?: string | null;
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
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          siret?: string | null;
          training_declaration_number?: string | null;
          qualiopi_mention?: string | null;
          legal_form?: string | null;
          share_capital?: string | null;
          vat_number?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          payment_terms?: string | null;
          late_penalty_terms?: string | null;
          collection_fee_terms?: string | null;
          vat_exemption_text?: string | null;
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
