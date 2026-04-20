export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      family_communications: {
        Row: {
          body: string
          created_at: string
          date_range_end: string
          date_range_start: string
          generated_by: string
          id: string
          organization_id: string
          recipient_contact_id: string
          resident_id: string
          sent_at: string | null
          source_note_ids: string[] | null
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          date_range_end: string
          date_range_start: string
          generated_by: string
          id?: string
          organization_id: string
          recipient_contact_id: string
          resident_id: string
          sent_at?: string | null
          source_note_ids?: string[] | null
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          generated_by?: string
          id?: string
          organization_id?: string
          recipient_contact_id?: string
          resident_id?: string
          sent_at?: string | null
          source_note_ids?: string[] | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_communications_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_communications_recipient_contact_id_fkey"
            columns: ["recipient_contact_id"]
            isOneToOne: false
            referencedRelation: "family_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_communications_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      family_contacts: {
        Row: {
          authorization_end_date: string | null
          authorization_on_file: boolean
          authorization_scope: string[]
          authorization_start_date: string | null
          communication_channels: string[]
          confidential_communication_notes: string | null
          created_at: string
          email: string | null
          id: string
          involved_in_care: boolean
          is_primary: boolean
          name: string
          personal_representative: boolean
          phone: string | null
          receives_updates: boolean
          relationship: string
          resident_id: string
          revocation_reason: string | null
          revoked_at: string | null
        }
        Insert: {
          authorization_end_date?: string | null
          authorization_on_file?: boolean
          authorization_scope?: string[]
          authorization_start_date?: string | null
          communication_channels?: string[]
          confidential_communication_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          involved_in_care?: boolean
          is_primary?: boolean
          name: string
          personal_representative?: boolean
          phone?: string | null
          receives_updates?: boolean
          relationship: string
          resident_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
        }
        Update: {
          authorization_end_date?: string | null
          authorization_on_file?: boolean
          authorization_scope?: string[]
          authorization_start_date?: string | null
          communication_channels?: string[]
          confidential_communication_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          involved_in_care?: boolean
          is_primary?: boolean
          name?: string
          personal_representative?: boolean
          phone?: string | null
          receives_updates?: boolean
          relationship?: string
          resident_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_contacts_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_reports: {
        Row: {
          created_at: string
          family_notified: boolean
          family_notified_at: string | null
          follow_up_date: string | null
          id: string
          incident_type: string
          manager_notes: string | null
          note_id: string
          organization_id: string
          report_text: string
          resident_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_notified?: boolean
          family_notified_at?: string | null
          follow_up_date?: string | null
          id?: string
          incident_type: string
          manager_notes?: string | null
          note_id: string
          organization_id: string
          report_text: string
          resident_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_notified?: boolean
          family_notified_at?: string | null
          follow_up_date?: string | null
          id?: string
          incident_type?: string
          manager_notes?: string | null
          note_id?: string
          organization_id?: string
          report_text?: string
          resident_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          created_at: string
          edited_output: string | null
          flagged_as_incident: boolean
          id: string
          is_edited: boolean
          is_structured: boolean
          last_structuring_attempt_at: string | null
          manually_flagged: boolean
          metadata: Json | null
          note_type: string
          organization_id: string
          raw_input: string
          resident_id: string
          sensitive_category: string | null
          sensitive_flag: boolean
          shift: string | null
          structured_output: string | null
          structuring_error: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          edited_output?: string | null
          flagged_as_incident?: boolean
          id?: string
          is_edited?: boolean
          is_structured?: boolean
          last_structuring_attempt_at?: string | null
          manually_flagged?: boolean
          metadata?: Json | null
          note_type: string
          organization_id: string
          raw_input: string
          resident_id: string
          sensitive_category?: string | null
          sensitive_flag?: boolean
          shift?: string | null
          structured_output?: string | null
          structuring_error?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          edited_output?: string | null
          flagged_as_incident?: boolean
          id?: string
          is_edited?: boolean
          is_structured?: boolean
          last_structuring_attempt_at?: string | null
          manually_flagged?: boolean
          metadata?: Json | null
          note_type?: string
          organization_id?: string
          raw_input?: string
          resident_id?: string
          sensitive_category?: string | null
          sensitive_flag?: boolean
          shift?: string | null
          structured_output?: string | null
          structuring_error?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email_from_name: string | null
          email_reply_to: string | null
          id: string
          name: string
          settings: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          timezone: string
          trial_ends_at: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_from_name?: string | null
          email_reply_to?: string | null
          id?: string
          name: string
          settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          timezone?: string
          trial_ends_at?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_from_name?: string | null
          email_reply_to?: string | null
          id?: string
          name?: string
          settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          timezone?: string
          trial_ends_at?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      residents: {
        Row: {
          care_notes_context: string | null
          conditions: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          move_in_date: string | null
          organization_id: string
          preferences: string | null
          room_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          care_notes_context?: string | null
          conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          id?: string
          last_name: string
          move_in_date?: string | null
          organization_id: string
          preferences?: string | null
          room_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          care_notes_context?: string | null
          conditions?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          move_in_date?: string | null
          organization_id?: string
          preferences?: string | null
          room_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          organization_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          call_type: string
          caregiver_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          error_message: string | null
          full_transcript: string | null
          id: string
          metadata: Json | null
          note_id: string | null
          organization_id: string
          resident_id: string
          started_at: string | null
          status: string
          updated_at: string
          vapi_call_id: string | null
        }
        Insert: {
          call_type?: string
          caregiver_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          error_message?: string | null
          full_transcript?: string | null
          id?: string
          metadata?: Json | null
          note_id?: string | null
          organization_id: string
          resident_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          vapi_call_id?: string | null
        }
        Update: {
          call_type?: string
          caregiver_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          error_message?: string | null
          full_transcript?: string | null
          id?: string
          metadata?: Json | null
          note_id?: string | null
          organization_id?: string
          resident_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          vapi_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_transcripts: {
        Row: {
          created_at: string
          id: string
          offset_ms: number | null
          role: string
          session_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          offset_ms?: number | null
          role: string
          session_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          offset_ms?: number | null
          role?: string
          session_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_summaries: {
        Row: {
          concerns: string[] | null
          created_at: string
          id: string
          incidents_count: number
          key_trends: string[] | null
          metadata: Json | null
          organization_id: string
          resident_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_note_ids: string[] | null
          status: string
          summary_text: string
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          concerns?: string[] | null
          created_at?: string
          id?: string
          incidents_count?: number
          key_trends?: string[] | null
          metadata?: Json | null
          organization_id: string
          resident_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_note_ids?: string[] | null
          status?: string
          summary_text: string
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          concerns?: string[] | null
          created_at?: string
          id?: string
          incidents_count?: number
          key_trends?: string[] | null
          metadata?: Json | null
          organization_id?: string
          resident_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_note_ids?: string[] | null
          status?: string
          summary_text?: string
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_summaries_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_summaries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicians: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          npi: string | null
          organization_id: string
          phone: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          npi?: string | null
          organization_id: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          npi?: string | null
          organization_id?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinicians_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_clinicians: {
        Row: {
          clinician_id: string
          created_at: string
          id: string
          is_primary: boolean
          relationship: string
          resident_id: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          relationship?: string
          resident_id: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          relationship?: string
          resident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_clinicians_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resident_clinicians_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      clinician_share_links: {
        Row: {
          clinician_id: string
          created_at: string
          created_by: string
          expires_at: string
          first_opened_at: string | null
          id: string
          last_opened_at: string | null
          open_count: number
          organization_id: string
          rendered_summary: Json
          resident_id: string
          revoked_at: string | null
          share_scope: Json
          token_hash: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          created_by: string
          expires_at: string
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          open_count?: number
          organization_id: string
          rendered_summary: Json
          resident_id: string
          revoked_at?: string | null
          share_scope?: Json
          token_hash: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          open_count?: number
          organization_id?: string
          rendered_summary?: Json
          resident_id?: string
          revoked_at?: string | null
          share_scope?: Json
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinician_share_links_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_share_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinician_share_links_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosure_events: {
        Row: {
          actor_user_id: string
          categories_shared: string[]
          created_at: string
          delivery_method: string
          id: string
          legal_basis: string
          organization_id: string
          recipient_id: string | null
          recipient_type: string
          resident_id: string
          sensitive_override: boolean
          share_link_id: string | null
          source_note_ids: string[]
        }
        Insert: {
          actor_user_id: string
          categories_shared?: string[]
          created_at?: string
          delivery_method: string
          id?: string
          legal_basis: string
          organization_id: string
          recipient_id?: string | null
          recipient_type: string
          resident_id: string
          sensitive_override?: boolean
          share_link_id?: string | null
          source_note_ids?: string[]
        }
        Update: {
          actor_user_id?: string
          categories_shared?: string[]
          created_at?: string
          delivery_method?: string
          id?: string
          legal_basis?: string
          organization_id?: string
          recipient_id?: string | null
          recipient_type?: string
          resident_id?: string
          sensitive_override?: boolean
          share_link_id?: string | null
          source_note_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "disclosure_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_events_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_events_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "clinician_share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_assignments: {
        Row: {
          caregiver_id: string
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          resident_id: string
          start_date: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          resident_id: string
          start_date?: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          resident_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_assignments_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_assignments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          object_id: string | null
          object_type: string | null
          organization_id: string
          result: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          object_id?: string | null
          object_type?: string | null
          organization_id: string
          result?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          object_id?: string | null
          object_type?: string | null
          organization_id?: string
          result?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_sensitive_access: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string
          id: string
          reason: string
          resident_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          id?: string
          reason: string
          resident_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          id?: string
          reason?: string
          resident_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_sensitive_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sensitive_access_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sensitive_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: { p_role: string }
        Returns: boolean
      }
      count_hidden_sensitive_notes: {
        Args: { p_resident_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

// Helper type aliases used across the app
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Resident = Database["public"]["Tables"]["residents"]["Row"];
export type FamilyContact = Database["public"]["Tables"]["family_contacts"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type IncidentReport = Database["public"]["Tables"]["incident_reports"]["Row"];
export type FamilyCommunication = Database["public"]["Tables"]["family_communications"]["Row"];
export type WeeklySummary = Database["public"]["Tables"]["weekly_summaries"]["Row"];
export type VoiceSession = Database["public"]["Tables"]["voice_sessions"]["Row"];
export type VoiceTranscript = Database["public"]["Tables"]["voice_transcripts"]["Row"];

