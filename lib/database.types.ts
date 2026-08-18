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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
          quote_id: string
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
          quote_id: string
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
          quote_id?: string
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
            foreignKeyName: "training_needs_analyses_quote_company_fkey"
            columns: ["quote_id", "company_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "company_id"]
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
          closed_at: string | null
          closed_by: string | null
          closure_status: string
          company_name: string | null
          created_at: string
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
          closed_at?: string | null
          closed_by?: string | null
          closure_status?: string
          company_name?: string | null
          created_at?: string
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
          closed_at?: string | null
          closed_by?: string | null
          closure_status?: string
          company_name?: string | null
          created_at?: string
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
      is_operational_manager: { Args: never; Returns: boolean }
      submit_candidate_satisfaction_survey: {
        Args: { p_answers: Json; p_token: string }
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
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
export type SessionClosureStatus = "open" | "ready" | "closed"
export type ForprevRegistrationStatus = "non_applicable" | "a_saisir" | "saisi" | "transmis" | "erreur"
export type GeneratedDocumentStatus = "draft" | "generated" | "sent" | "signed" | "archived"
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "archived"
export type TrainingType = "sst_initial" | "mac_sst" | "hygiene"
export type AttendanceSlotStatus = "draft" | "sent" | "open" | "closed"
export type AttendanceDeliveryChannel = "email" | "sms"
export type AttendanceDeliveryStatus = "pending" | "sent" | "failed"
export type AttendanceResponseStatus = "pending" | "present" | "absent" | "issue"
