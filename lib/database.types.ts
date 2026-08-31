export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance_responses: {
        Row: {
          attendance_slot_id: string
          candidate_id: string
          created_at: string
          delivery_channel: string
          delivery_sent_at: string | null
          delivery_status: string
          id: string
          ip_address: string | null
          responded_at: string | null
          response_status: string
          response_token: string
          trainer_overridden_at: string | null
          trainer_override_note: string | null
          trainer_override_status: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          attendance_slot_id: string
          candidate_id: string
          created_at?: string
          delivery_channel?: string
          delivery_sent_at?: string | null
          delivery_status?: string
          id?: string
          ip_address?: string | null
          responded_at?: string | null
          response_status?: string
          response_token: string
          trainer_overridden_at?: string | null
          trainer_override_note?: string | null
          trainer_override_status?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          attendance_slot_id?: string
          candidate_id?: string
          created_at?: string
          delivery_channel?: string
          delivery_sent_at?: string | null
          delivery_status?: string
          id?: string
          ip_address?: string | null
          responded_at?: string | null
          response_status?: string
          response_token?: string
          trainer_overridden_at?: string | null
          trainer_override_note?: string | null
          trainer_override_status?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_responses_attendance_slot_id_fkey"
            columns: ["attendance_slot_id"]
            isOneToOne: false
            referencedRelation: "attendance_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_responses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_slots: {
        Row: {
          closed_at: string | null
          created_at: string
          ends_at: string | null
          id: string
          period: string
          sent_at: string | null
          session_id: string
          slot_date: string
          slot_label: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          period?: string
          sent_at?: string | null
          session_id: string
          slot_date: string
          slot_label: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          period?: string
          sent_at?: string | null
          session_id?: string
          slot_date?: string
          slot_label?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_slots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_evaluations: {
        Row: {
          candidate_id: string
          created_at: string
          evaluated_at: string | null
          evaluated_by: string | null
          evaluation_type: string
          id: string
          metadata: Json
          result: string
          session_id: string
          status: string
          trainer_notes: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_type?: string
          id?: string
          metadata?: Json
          result?: string
          session_id: string
          status?: string
          trainer_notes?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluation_type?: string
          id?: string
          metadata?: Json
          result?: string
          session_id?: string
          status?: string
          trainer_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_evaluations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_evaluations_candidate_session_fkey"
            columns: ["candidate_id", "session_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id", "session_id"]
          },
          {
            foreignKeyName: "candidate_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_mac_identities: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          merge_reason: string | null
          merged_at: string | null
          merged_by: string | null
          merged_into_identity_id: string | null
          notes: string | null
          status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          merge_reason?: string | null
          merged_at?: string | null
          merged_by?: string | null
          merged_into_identity_id?: string | null
          notes?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          merge_reason?: string | null
          merged_at?: string | null
          merged_by?: string | null
          merged_into_identity_id?: string | null
          notes?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_mac_identities_merged_into_identity_id_fkey"
            columns: ["merged_into_identity_id"]
            isOneToOne: false
            referencedRelation: "candidate_mac_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_mac_identity_operations: {
        Row: {
          candidate_id: string | null
          created_at: string
          id: string
          operation_type: string
          performed_by: string | null
          reason: string | null
          source_identity_id: string | null
          target_identity_id: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          operation_type: string
          performed_by?: string | null
          reason?: string | null
          source_identity_id?: string | null
          target_identity_id?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          operation_type?: string
          performed_by?: string | null
          reason?: string | null
          source_identity_id?: string | null
          target_identity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_mac_identity_operations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_mac_identity_operations_source_identity_id_fkey"
            columns: ["source_identity_id"]
            isOneToOne: false
            referencedRelation: "candidate_mac_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_mac_identity_operations_target_identity_id_fkey"
            columns: ["target_identity_id"]
            isOneToOne: false
            referencedRelation: "candidate_mac_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_satisfaction_surveys: {
        Row: {
          answers: Json
          attendance_response_id: string
          candidate_id: string
          created_at: string
          id: string
          session_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          attendance_response_id: string
          candidate_id: string
          created_at?: string
          id?: string
          session_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          attendance_response_id?: string
          candidate_id?: string
          created_at?: string
          id?: string
          session_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_satisfaction_surveys_attendance_response_id_fkey"
            columns: ["attendance_response_id"]
            isOneToOne: true
            referencedRelation: "attendance_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_satisfaction_surveys_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_satisfaction_surveys_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          company: string | null
          company_id: string | null
          created_at: string
          email: string | null
          first_name: string
          forprev_registration_status: string
          handicap_notes: string | null
          id: string
          job_title: string | null
          last_name: string
          mac_identity_id: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          session_id: string | null
          sst_certificate_expires_at: string | null
          sst_certificate_obtained_at: string | null
          sst_certificate_ref: string | null
          validated_at: string | null
          validation_status: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          forprev_registration_status?: string
          handicap_notes?: string | null
          id?: string
          job_title?: string | null
          last_name: string
          mac_identity_id?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          session_id?: string | null
          sst_certificate_expires_at?: string | null
          sst_certificate_obtained_at?: string | null
          sst_certificate_ref?: string | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          forprev_registration_status?: string
          handicap_notes?: string | null
          id?: string
          job_title?: string | null
          last_name?: string
          mac_identity_id?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          session_id?: string | null
          sst_certificate_expires_at?: string | null
          sst_certificate_obtained_at?: string | null
          sst_certificate_ref?: string | null
          validated_at?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_mac_identity_id_fkey"
            columns: ["mac_identity_id"]
            isOneToOne: false
            referencedRelation: "candidate_mac_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_companies: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          contact_phone: string | null
          contact_role: string | null
          country: string | null
          created_at: string
          id: string
          notes: string | null
          postal_code: string | null
          siret: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_satisfaction_surveys: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          delivery_error_at: string | null
          id: string
          invoice_id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string
          needs_rating: number | null
          organization_rating: number | null
          overall_rating: number | null
          public_identity: string | null
          publication_consent: boolean
          published_at: string | null
          quote_id: string | null
          sent_at: string | null
          session_id: string | null
          status: string
          submitted_at: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          delivery_error_at?: string | null
          id?: string
          invoice_id: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          needs_rating?: number | null
          organization_rating?: number | null
          overall_rating?: number | null
          public_identity?: string | null
          publication_consent?: boolean
          published_at?: string | null
          quote_id?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string
          submitted_at?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          delivery_error_at?: string | null
          id?: string
          invoice_id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          needs_rating?: number | null
          organization_rating?: number | null
          overall_rating?: number | null
          public_identity?: string | null
          publication_consent?: boolean
          published_at?: string | null
          quote_id?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string
          submitted_at?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_satisfaction_surveys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_satisfaction_surveys_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_satisfaction_surveys_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_satisfaction_surveys_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_satisfaction_surveys_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          candidate_id: string | null
          company_id: string | null
          created_at: string
          document_ref: string
          document_type: string
          file_url: string | null
          id: string
          metadata: Json
          session_id: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          document_ref: string
          document_type: string
          file_url?: string | null
          id?: string
          metadata?: Json
          session_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          candidate_id?: string | null
          company_id?: string | null
          created_at?: string
          document_ref?: string
          document_type?: string
          file_url?: string | null
          id?: string
          metadata?: Json
          session_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_complaint_attachments: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          invoice_complaint_id: string
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          bucket_id?: string
          created_at?: string
          id?: string
          invoice_complaint_id: string
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          invoice_complaint_id?: string
          mime_type?: string
          original_filename?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_complaint_attachments_invoice_complaint_id_fkey"
            columns: ["invoice_complaint_id"]
            isOneToOne: false
            referencedRelation: "invoice_complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_complaint_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_complaints: {
        Row: {
          company_id: string
          complaint_details: string
          corrective_actions: string
          created_at: string
          customer_expectation: string
          dissatisfaction_summary: string
          follow_up_actions: string
          id: string
          internal_notes: string
          invoice_id: string
          preventive_actions: string
          quote_id: string | null
          resolved_at: string | null
          root_cause: string
          send_with_invoice: boolean
          sent_with_invoice_at: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          complaint_details?: string
          corrective_actions?: string
          created_at?: string
          customer_expectation?: string
          dissatisfaction_summary?: string
          follow_up_actions?: string
          id?: string
          internal_notes?: string
          invoice_id: string
          preventive_actions?: string
          quote_id?: string | null
          resolved_at?: string | null
          root_cause?: string
          send_with_invoice?: boolean
          sent_with_invoice_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          complaint_details?: string
          corrective_actions?: string
          created_at?: string
          customer_expectation?: string
          dissatisfaction_summary?: string
          follow_up_actions?: string
          id?: string
          internal_notes?: string
          invoice_id?: string
          preventive_actions?: string
          quote_id?: string | null
          resolved_at?: string | null
          root_cause?: string
          send_with_invoice?: boolean
          sent_with_invoice_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_complaints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_complaints_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_complaints_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          description: string | null
          id: string
          invoice_id: string
          label: string
          line_order: number
          line_total: number
          quantity: number
          unit_price: number
        }
        Insert: {
          description?: string | null
          id?: string
          invoice_id: string
          label: string
          line_order?: number
          line_total?: number
          quantity?: number
          unit_price?: number
        }
        Update: {
          description?: string | null
          id?: string
          invoice_id?: string
          label?: string
          line_order?: number
          line_total?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          notes: string | null
          quote_id: string
          send_company_satisfaction: boolean
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_ttc: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          quote_id: string
          send_company_satisfaction?: boolean
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_ttc?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          quote_id?: string
          send_company_satisfaction?: boolean
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_ttc?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      mac_sst_reminder_attempts: {
        Row: {
          attempted_at: string
          brevo_message_id: string | null
          id: string
          reminder_id: string
          sent_at: string | null
          status: string
          technical_error: string | null
        }
        Insert: {
          attempted_at?: string
          brevo_message_id?: string | null
          id?: string
          reminder_id: string
          sent_at?: string | null
          status: string
          technical_error?: string | null
        }
        Update: {
          attempted_at?: string
          brevo_message_id?: string | null
          id?: string
          reminder_id?: string
          sent_at?: string | null
          status?: string
          technical_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mac_sst_reminder_attempts_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "mac_sst_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      mac_sst_reminders: {
        Row: {
          attempt_count: number
          brevo_message_id: string | null
          candidate_id: string
          certificate_end_date: string
          created_at: string
          id: string
          idempotency_key: string
          last_attempt_at: string | null
          mac_due_date: string
          mac_identity_id: string | null
          recipient_email: string | null
          reference_session_id: string
          reminder_kind: string
          sent_at: string | null
          status: string
          technical_error: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          brevo_message_id?: string | null
          candidate_id: string
          certificate_end_date: string
          created_at?: string
          id?: string
          idempotency_key: string
          last_attempt_at?: string | null
          mac_due_date: string
          mac_identity_id?: string | null
          recipient_email?: string | null
          reference_session_id: string
          reminder_kind: string
          sent_at?: string | null
          status?: string
          technical_error?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          brevo_message_id?: string | null
          candidate_id?: string
          certificate_end_date?: string
          created_at?: string
          id?: string
          idempotency_key?: string
          last_attempt_at?: string | null
          mac_due_date?: string
          mac_identity_id?: string | null
          recipient_email?: string | null
          reference_session_id?: string
          reminder_kind?: string
          sent_at?: string | null
          status?: string
          technical_error?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mac_sst_reminders_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mac_sst_reminders_mac_identity_id_fkey"
            columns: ["mac_identity_id"]
            isOneToOne: false
            referencedRelation: "candidate_mac_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mac_sst_reminders_reference_session_id_fkey"
            columns: ["reference_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          address: string | null
          city: string | null
          collection_fee_terms: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          document_prefix: string | null
          email: string | null
          handicap_contact_email: string | null
          handicap_contact_name: string | null
          id: string
          late_penalty_terms: string | null
          legal_form: string | null
          legal_representative: string | null
          logo_url: string | null
          nda: string | null
          organization_name: string
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          qualiopi_label: string | null
          share_capital: string | null
          signature_url: string | null
          siret: string | null
          vat_exemption_text: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          collection_fee_terms?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          document_prefix?: string | null
          email?: string | null
          handicap_contact_email?: string | null
          handicap_contact_name?: string | null
          id?: string
          late_penalty_terms?: string | null
          legal_form?: string | null
          legal_representative?: string | null
          logo_url?: string | null
          nda?: string | null
          organization_name: string
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          qualiopi_label?: string | null
          share_capital?: string | null
          signature_url?: string | null
          siret?: string | null
          vat_exemption_text?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          collection_fee_terms?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          document_prefix?: string | null
          email?: string | null
          handicap_contact_email?: string | null
          handicap_contact_name?: string | null
          id?: string
          late_penalty_terms?: string | null
          legal_form?: string | null
          legal_representative?: string | null
          logo_url?: string | null
          nda?: string | null
          organization_name?: string
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          qualiopi_label?: string | null
          share_capital?: string | null
          signature_url?: string | null
          siret?: string | null
          vat_exemption_text?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accessibility_details: string | null
          candidate_count: number
          company_id: string
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          location: string | null
          mac_previous_certificate_date: string | null
          mac_previous_certificate_ref: string | null
          notes: string | null
          objectives: string | null
          prerequisites: string | null
          price_ht: number
          programme_outline: string | null
          quote_date: string
          quote_number: string
          session_end_date: string | null
          session_id: string | null
          session_start_date: string | null
          status: string
          title: string
          total_ttc: number | null
          trainer_name: string | null
          training_family: string
          training_type: string
          updated_at: string
          vat_rate: number
        }
        Insert: {
          accessibility_details?: string | null
          candidate_count?: number
          company_id: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          location?: string | null
          mac_previous_certificate_date?: string | null
          mac_previous_certificate_ref?: string | null
          notes?: string | null
          objectives?: string | null
          prerequisites?: string | null
          price_ht: number
          programme_outline?: string | null
          quote_date?: string
          quote_number: string
          session_end_date?: string | null
          session_id?: string | null
          session_start_date?: string | null
          status?: string
          title: string
          total_ttc?: number | null
          trainer_name?: string | null
          training_family?: string
          training_type?: string
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          accessibility_details?: string | null
          candidate_count?: number
          company_id?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          location?: string | null
          mac_previous_certificate_date?: string | null
          mac_previous_certificate_ref?: string | null
          notes?: string | null
          objectives?: string | null
          prerequisites?: string | null
          price_ht?: number
          programme_outline?: string | null
          quote_date?: string
          quote_number?: string
          session_end_date?: string | null
          session_id?: string | null
          session_start_date?: string | null
          status?: string
          title?: string
          total_ttc?: number | null
          trainer_name?: string | null
          training_family?: string
          training_type?: string
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_archives: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          error_summary: string | null
          id: string
          manifest: Json
          manifest_hash: string | null
          manifest_storage_path: string | null
          manifest_version: string
          missing_items: Json
          previous_archive_id: string | null
          session_id: string
          status: string
          storage_bucket: string
          updated_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          error_summary?: string | null
          id?: string
          manifest?: Json
          manifest_hash?: string | null
          manifest_storage_path?: string | null
          manifest_version?: string
          missing_items?: Json
          previous_archive_id?: string | null
          session_id: string
          status?: string
          storage_bucket?: string
          updated_at?: string
          version: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          error_summary?: string | null
          id?: string
          manifest?: Json
          manifest_hash?: string | null
          manifest_storage_path?: string | null
          manifest_version?: string
          missing_items?: Json
          previous_archive_id?: string | null
          session_id?: string
          status?: string
          storage_bucket?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_archives_previous_archive_id_fkey"
            columns: ["previous_archive_id"]
            isOneToOne: false
            referencedRelation: "session_archives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_archives_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          module_id: string
          session_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id: string
          session_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_module_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_training_resource_audit: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          performed_by: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          performed_by: string
          resource_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          performed_by?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_training_resource_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_training_resource_audit_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "shared_training_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_training_resource_comments: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          resource_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          resource_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_training_resource_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_training_resource_comments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "shared_training_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_training_resource_notifications: {
        Row: {
          created_at: string
          dedupe_key: string
          event_type: string
          id: string
          read_at: string | null
          recipient_id: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          event_type: string
          id?: string
          read_at?: string | null
          recipient_id: string
          resource_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          event_type?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_training_resource_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_training_resource_notifications_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "shared_training_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_training_resource_versions: {
        Row: {
          created_at: string
          created_by: string
          external_url: string | null
          id: string
          mime_type: string | null
          original_filename: string | null
          resource_id: string
          resource_type: string
          sha256: string | null
          size_bytes: number | null
          storage_bucket: string | null
          storage_path: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          external_url?: string | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          resource_id: string
          resource_type: string
          sha256?: string | null
          size_bytes?: number | null
          storage_bucket?: string | null
          storage_path?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          external_url?: string | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          resource_id?: string
          resource_type?: string
          sha256?: string | null
          size_bytes?: number | null
          storage_bucket?: string | null
          storage_path?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_training_resource_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_training_resource_versions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "shared_training_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_training_resources: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          integrated_at: string | null
          integrated_by: string | null
          integrated_note: string | null
          last_activity_at: string
          priority: string
          requested_change: string | null
          resource_type: string
          status: string
          title: string
          training_module_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          integrated_at?: string | null
          integrated_by?: string | null
          integrated_note?: string | null
          last_activity_at?: string
          priority?: string
          requested_change?: string | null
          resource_type: string
          status?: string
          title: string
          training_module_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          integrated_at?: string | null
          integrated_by?: string | null
          integrated_note?: string | null
          last_activity_at?: string
          priority?: string
          requested_change?: string | null
          resource_type?: string
          status?: string
          title?: string
          training_module_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_training_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_training_resources_integrated_by_fkey"
            columns: ["integrated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_training_resources_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      qualiopi_watch_entries: {
        Row: {
          consulted_on: string
          created_at: string
          created_by: string
          decision: string
          evidence_url: string | null
          id: string
          impact: string
          indicator: number
          next_review_on: string | null
          source_name: string
          source_url: string
          status: string
          summary: string
          topic: string
          updated_at: string
        }
        Insert: {
          consulted_on: string
          created_at?: string
          created_by: string
          decision: string
          evidence_url?: string | null
          id?: string
          impact: string
          indicator: number
          next_review_on?: string | null
          source_name: string
          source_url: string
          status?: string
          summary: string
          topic: string
          updated_at?: string
        }
        Update: {
          consulted_on?: string
          created_at?: string
          created_by?: string
          decision?: string
          evidence_url?: string | null
          id?: string
          impact?: string
          indicator?: number
          next_review_on?: string | null
          source_name?: string
          source_url?: string
          status?: string
          summary?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualiopi_watch_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_documents: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          id: string
          label: string
          mime_type: string
          storage_path: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          id?: string
          label: string
          mime_type: string
          storage_path: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          id?: string
          label?: string
          mime_type?: string
          storage_path?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_documents_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          content_text: string | null
          created_at: string
          estimated_minutes: number | null
          id: string
          is_active: boolean
          module_order: number
          module_type: string
          parent_module_id: string | null
          pdf_url: string | null
          summary: string | null
          title: string
          trainer_guidance: string | null
          video_url: string | null
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          module_order: number
          module_type?: string
          parent_module_id?: string | null
          pdf_url?: string | null
          summary?: string | null
          title: string
          trainer_guidance?: string | null
          video_url?: string | null
        }
        Update: {
          content_text?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean
          module_order?: number
          module_type?: string
          parent_module_id?: string | null
          pdf_url?: string | null
          summary?: string | null
          title?: string
          trainer_guidance?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_parent_module_id_fkey"
            columns: ["parent_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_needs_analyses: {
        Row: {
          answers: Json
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_step: number
          first_opened_at: string | null
          id: string
          last_saved_at: string | null
          progress_percent: number
          questionnaire_version: string
          quote_id: string
          quote_snapshot: Json
          respondent_email: string | null
          respondent_name: string | null
          respondent_role: string | null
          status: string
          token_expires_at: string | null
          token_hash: string | null
          training_type: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          first_opened_at?: string | null
          id?: string
          last_saved_at?: string | null
          progress_percent?: number
          questionnaire_version?: string
          quote_id: string
          quote_snapshot?: Json
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_role?: string | null
          status?: string
          token_expires_at?: string | null
          token_hash?: string | null
          training_type: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          first_opened_at?: string | null
          id?: string
          last_saved_at?: string | null
          progress_percent?: number
          questionnaire_version?: string
          quote_id?: string
          quote_snapshot?: Json
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_role?: string | null
          status?: string
          token_expires_at?: string | null
          token_hash?: string | null
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_needs_analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_needs_analyses_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quizzes: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          module_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          module_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          accessibility_details: string | null
          administrative_observations: string | null
          archive_status: string
          archived_at: string | null
          archived_by: string | null
          closed_at: string | null
          closed_by: string | null
          closure_status: string
          company_name: string | null
          created_at: string
          current_archive_id: string | null
          duration_hours: number | null
          end_date: string
          final_absent_count: number
          final_admitted_count: number
          final_not_admitted_count: number
          final_present_count: number
          final_registered_count: number
          id: string
          location: string
          mac_previous_certificate_date: string | null
          mac_previous_certificate_ref: string | null
          objectives: string | null
          prerequisites: string | null
          programme_outline: string | null
          source_quote_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["training_session_status"]
          title: string
          trainer_id: string | null
          trainer_name: string | null
          trainer_report: string | null
          trainer_user_id: string | null
          training_family: string
          training_type: string
        }
        Insert: {
          accessibility_details?: string | null
          administrative_observations?: string | null
          archive_status?: string
          archived_at?: string | null
          archived_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closure_status?: string
          company_name?: string | null
          created_at?: string
          current_archive_id?: string | null
          duration_hours?: number | null
          end_date: string
          final_absent_count?: number
          final_admitted_count?: number
          final_not_admitted_count?: number
          final_present_count?: number
          final_registered_count?: number
          id?: string
          location: string
          mac_previous_certificate_date?: string | null
          mac_previous_certificate_ref?: string | null
          objectives?: string | null
          prerequisites?: string | null
          programme_outline?: string | null
          source_quote_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["training_session_status"]
          title: string
          trainer_id?: string | null
          trainer_name?: string | null
          trainer_report?: string | null
          trainer_user_id?: string | null
          training_family?: string
          training_type?: string
        }
        Update: {
          accessibility_details?: string | null
          administrative_observations?: string | null
          archive_status?: string
          archived_at?: string | null
          archived_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closure_status?: string
          company_name?: string | null
          created_at?: string
          current_archive_id?: string | null
          duration_hours?: number | null
          end_date?: string
          final_absent_count?: number
          final_admitted_count?: number
          final_not_admitted_count?: number
          final_present_count?: number
          final_registered_count?: number
          id?: string
          location?: string
          mac_previous_certificate_date?: string | null
          mac_previous_certificate_ref?: string | null
          objectives?: string | null
          prerequisites?: string | null
          programme_outline?: string | null
          source_quote_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["training_session_status"]
          title?: string
          trainer_id?: string | null
          trainer_name?: string | null
          trainer_report?: string | null
          trainer_user_id?: string | null
          training_family?: string
          training_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_current_archive_id_fkey"
            columns: ["current_archive_id"]
            isOneToOne: false
            referencedRelation: "session_archives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_candidate_mac_identities: { Args: never; Returns: number }
      can_access_attendance_response: {
        Args: { p_response_id: string }
        Returns: boolean
      }
      can_access_attendance_slot: {
        Args: { p_slot_id: string }
        Returns: boolean
      }
      can_access_candidate: {
        Args: { p_candidate_id: string }
        Returns: boolean
      }
      can_access_candidate_evaluation: {
        Args: { p_evaluation_id: string }
        Returns: boolean
      }
      can_access_company: { Args: { p_company_id: string }; Returns: boolean }
      can_access_generated_document: {
        Args: { p_document_id: string }
        Returns: boolean
      }
      can_access_invoice: { Args: { p_invoice_id: string }; Returns: boolean }
      can_access_invoice_complaint: {
        Args: { p_complaint_id: string }
        Returns: boolean
      }
      can_access_quote: { Args: { p_quote_id: string }; Returns: boolean }
      can_access_session: { Args: { p_session_id: string }; Returns: boolean }
      can_access_storage_path: { Args: { p_path: string }; Returns: boolean }
      can_delete_building_session_archive: {
        Args: { p_path: string }
        Returns: boolean
      }
      claim_mac_sst_reminder: { Args: { p_id: string }; Returns: boolean }
      confirm_attendance_response: {
        Args: {
          p_ip?: string
          p_response_status?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: {
          candidate_email: string
          candidate_id: string
          candidate_name: string
          responded_at: string
          response_id: string
          response_status: string
          session_id: string
          session_location: string
          session_title: string
          slot_date: string
          slot_id: string
          slot_label: string
          token: string
          trainer_override_status: string
        }[]
      }
      create_or_get_company_satisfaction_survey: {
        Args: {
          p_company_id: string
          p_invoice_id: string
          p_quote_id: string
          p_session_id: string
          p_token_hash: string
        }
        Returns: {
          id: string
          invoice_id: string
          status: string
          submitted_at: string
          token_hash: string
        }[]
      }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_attendance_response_by_token: {
        Args: { p_token: string }
        Returns: {
          candidate_email: string
          candidate_id: string
          candidate_name: string
          responded_at: string
          response_id: string
          response_status: string
          session_id: string
          session_location: string
          session_title: string
          slot_date: string
          slot_id: string
          slot_label: string
          token: string
          trainer_override_status: string
        }[]
      }
      get_candidate_satisfaction_context: {
        Args: { p_token: string }
        Returns: {
          is_final_slot: boolean
          submitted: boolean
        }[]
      }
      get_company_satisfaction_context: {
        Args: { p_token: string }
        Returns: {
          available: boolean
          company_name: string
          completed: boolean
          training_title: string
        }[]
      }
      is_operational_manager: { Args: never; Returns: boolean }
      link_candidate_mac_identity: {
        Args: {
          p_candidate_id: string
          p_identity_id: string
          p_reason: string
        }
        Returns: string
      }
      mark_company_satisfaction_delivery: {
        Args: { p_success: boolean; p_survey_id: string }
        Returns: boolean
      }
      merge_candidate_mac_identities: {
        Args: {
          p_canonical_identity_id: string
          p_reason: string
          p_secondary_identity_id: string
        }
        Returns: string
      }
      submit_candidate_satisfaction_survey: {
        Args: { p_answers: Json; p_token: string }
        Returns: boolean
      }
      submit_company_satisfaction_survey: {
        Args: {
          p_comment: string
          p_needs_rating: number
          p_organization_rating: number
          p_overall_rating: number
          p_public_identity: string
          p_publication_consent: boolean
          p_token: string
        }
        Returns: string
      }
      uuid_or_null: { Args: { p_value: string }; Returns: string }
      verify_generated_document: {
        Args: { p_ref: string }
        Returns: {
          created_at: string
          document_ref: string
          document_type: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "lead_trainer" | "trainer"
      quote_status: "draft" | "sent" | "accepted" | "rejected" | "archived"
      training_session_status:
        | "draft"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "lead_trainer", "trainer"],
      quote_status: ["draft", "sent", "accepted", "rejected", "archived"],
      training_session_status: [
        "draft",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const

// Application-level aliases retained for existing consumers. The database
// generator exposes most of these values as text columns rather than enums.
export type TrainingSessionStatus = "draft" | "scheduled" | "in_progress" | "completed" | "cancelled"
export type CandidateValidationStatus = "pending" | "validated" | "not_validated"
export type CandidateEvaluationType = "theorique" | "pratique" | "globale"
export type CandidateEvaluationStatus = "non_evalue" | "en_cours" | "acquis" | "non_acquis" | "absent"
export type CandidateEvaluationResult = "admis" | "non_admis" | "absent" | "partiel" | "non_renseigne"
export type SessionClosureStatus = "open" | "ready" | "closed" | "archived"
export type ForprevRegistrationStatus = "non_applicable" | "a_saisir" | "saisi" | "transmis" | "erreur"
export type GeneratedDocumentStatus = "draft" | "generated" | "sent" | "signed" | "archived"
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "archived"
export type TrainingType = "sst_initial" | "mac_sst" | "hygiene"
export type AttendanceSlotStatus = "draft" | "sent" | "open" | "closed"
export type AttendanceDeliveryChannel = "email" | "sms"
export type AttendanceDeliveryStatus = "pending" | "sent" | "failed"
export type AttendanceResponseStatus = "pending" | "present" | "absent" | "issue"
