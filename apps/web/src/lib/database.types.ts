/**
 * Generated from Supabase project ThriveLife (`bpbfezmierdtproczkpj`, ca-central-1).
 * Refresh with MCP `generate_typescript_types` or `npx supabase gen types typescript --project-id bpbfezmierdtproczkpj`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      assessment_responses: {
        Row: {
          answer: Json | null
          created_at: string
          dwell_ms: number | null
          id: string
          item_id: string
          session_id: string
          skipped: boolean
        }
        Insert: {
          answer?: Json | null
          created_at?: string
          dwell_ms?: number | null
          id: string
          item_id: string
          session_id: string
          skipped?: boolean
        }
        Update: {
          answer?: Json | null
          created_at?: string
          dwell_ms?: number | null
          id?: string
          item_id?: string
          session_id?: string
          skipped?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          abandoned_at_item_id: string | null
          completed_at: string | null
          device_type: string | null
          dwell_ms_by_screen: Json
          id: string
          instrument_id: string
          interval_since_previous_days: number | null
          result_summary: Json | null
          started_at: string
          status: string
          user_id: string
          version: number
        }
        Insert: {
          abandoned_at_item_id?: string | null
          completed_at?: string | null
          device_type?: string | null
          dwell_ms_by_screen?: Json
          id: string
          instrument_id: string
          interval_since_previous_days?: number | null
          result_summary?: Json | null
          started_at?: string
          status?: string
          user_id: string
          version?: number
        }
        Update: {
          abandoned_at_item_id?: string | null
          completed_at?: string | null
          device_type?: string | null
          dwell_ms_by_screen?: Json
          id?: string
          instrument_id?: string
          interval_since_previous_days?: number | null
          result_summary?: Json | null
          started_at?: string
          status?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      batteries: {
        Row: {
          book_chapter_ref: string | null
          covers: string
          display_order: number
          icon: string
          id: string
          is_fixture: boolean
          name: string
          think_of_it_as: string
        }
        Insert: {
          book_chapter_ref?: string | null
          covers?: string
          display_order: number
          icon?: string
          id: string
          is_fixture?: boolean
          name: string
          think_of_it_as?: string
        }
        Update: {
          book_chapter_ref?: string | null
          covers?: string
          display_order?: number
          icon?: string
          id?: string
          is_fixture?: boolean
          name?: string
          think_of_it_as?: string
        }
        Relationships: []
      }
      battery_results: {
        Row: {
          battery_id: string
          battery_state: string | null
          capacity_score: number | null
          computed_at: string
          id: string
          recharge_score: number | null
          session_id: string
          strain_score: number | null
        }
        Insert: {
          battery_id: string
          battery_state?: string | null
          capacity_score?: number | null
          computed_at?: string
          id: string
          recharge_score?: number | null
          session_id: string
          strain_score?: number | null
        }
        Update: {
          battery_id?: string
          battery_state?: string | null
          capacity_score?: number | null
          computed_at?: string
          id?: string
          recharge_score?: number | null
          session_id?: string
          strain_score?: number | null
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          accepted_at: string
          id: string
          user_id: string
          version: string
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string
          id: string
          user_id: string
          version: string
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string
          id?: string
          user_id?: string
          version?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      constructs: {
        Row: {
          battery_id: string
          book_chapter_ref: string | null
          definition: string
          dimension: string
          id: string
          is_fixture: boolean
          subconstruct: string | null
          workflow_status: string
        }
        Insert: {
          battery_id: string
          book_chapter_ref?: string | null
          definition?: string
          dimension: string
          id: string
          is_fixture?: boolean
          subconstruct?: string | null
          workflow_status?: string
        }
        Update: {
          battery_id?: string
          book_chapter_ref?: string | null
          definition?: string
          dimension?: string
          id?: string
          is_fixture?: boolean
          subconstruct?: string | null
          workflow_status?: string
        }
        Relationships: []
      }
      content_copy: {
        Row: {
          body: string
          id: string
          is_fixture: boolean
          key: string
          kind: string
          title: string
          workflow_status: string
        }
        Insert: {
          body: string
          id: string
          is_fixture?: boolean
          key: string
          kind: string
          title: string
          workflow_status?: string
        }
        Update: {
          body?: string
          id?: string
          is_fixture?: boolean
          key?: string
          kind?: string
          title?: string
          workflow_status?: string
        }
        Relationships: []
      }
      daily_check_ins: {
        Row: {
          battery_id: string
          completion: string
          date: string
          id: string
          mode: string
          note: string | null
          recharge_selected: string | null
          timezone: string
          user_id: string
        }
        Insert: {
          battery_id: string
          completion: string
          date: string
          id: string
          mode: string
          note?: string | null
          recharge_selected?: string | null
          timezone?: string
          user_id: string
        }
        Update: {
          battery_id?: string
          completion?: string
          date?: string
          id?: string
          mode?: string
          note?: string | null
          recharge_selected?: string | null
          timezone?: string
          user_id?: string
        }
        Relationships: []
      }
      drain_results: {
        Row: {
          answered_count: number
          completed_at: string
          id: string
          intervention_triggered: boolean
          session_id: string
          total_score: number
          user_id: string
        }
        Insert: {
          answered_count: number
          completed_at?: string
          id: string
          intervention_triggered?: boolean
          session_id: string
          total_score: number
          user_id: string
        }
        Update: {
          answered_count?: number
          completed_at?: string
          id?: string
          intervention_triggered?: boolean
          session_id?: string
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      driving_modes: {
        Row: {
          declared_mode: string
          id: string
          set_at: string
          source: string
          suggested_mode: string | null
          user_id: string
        }
        Insert: {
          declared_mode: string
          id: string
          set_at?: string
          source: string
          suggested_mode?: string | null
          user_id: string
        }
        Update: {
          declared_mode?: string
          id?: string
          set_at?: string
          source?: string
          suggested_mode?: string | null
          user_id?: string
        }
        Relationships: []
      }
      escalation_events: {
        Row: {
          dismissed: boolean
          dismissed_at: string | null
          id: string
          message_shown: string
          tier: number
          triggered_at: string
          user_id: string
        }
        Insert: {
          dismissed?: boolean
          dismissed_at?: string | null
          id: string
          message_shown: string
          tier: number
          triggered_at?: string
          user_id: string
        }
        Update: {
          dismissed?: boolean
          dismissed_at?: string | null
          id?: string
          message_shown?: string
          tier?: number
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instruments: {
        Row: {
          approximate_item_count: number
          completion_seconds_hint: string
          dashboard_authority: string
          description: string
          id: string
          name: string
          timeframe: string
        }
        Insert: {
          approximate_item_count?: number
          completion_seconds_hint?: string
          dashboard_authority?: string
          description?: string
          id: string
          name: string
          timeframe: string
        }
        Update: {
          approximate_item_count?: number
          completion_seconds_hint?: string
          dashboard_authority?: string
          description?: string
          id?: string
          name?: string
          timeframe?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          active: boolean
          battery_id: string | null
          construct_id: string
          id: string
          instrument_id: string
          is_fixture: boolean
          response_scale_id: string
          scoring_direction: string | null
          timeframe: string
          version: number
          wording: string
          workflow_status: string
        }
        Insert: {
          active?: boolean
          battery_id?: string | null
          construct_id: string
          id: string
          instrument_id: string
          is_fixture?: boolean
          response_scale_id: string
          scoring_direction?: string | null
          timeframe: string
          version?: number
          wording: string
          workflow_status?: string
        }
        Update: {
          active?: boolean
          battery_id?: string | null
          construct_id?: string
          id?: string
          instrument_id?: string
          is_fixture?: boolean
          response_scale_id?: string
          scoring_direction?: string | null
          timeframe?: string
          version?: number
          wording?: string
          workflow_status?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          context_answers: Json
          day3_prompted_at: string | null
          day7_prompted_at: string | null
          declined_full_assessment_at: string | null
          first_recharge_completed_at: string | null
          step: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          context_answers?: Json
          day3_prompted_at?: string | null
          day7_prompted_at?: string | null
          declined_full_assessment_at?: string | null
          first_recharge_completed_at?: string | null
          step?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          context_answers?: Json
          day3_prompted_at?: string | null
          day7_prompted_at?: string | null
          declined_full_assessment_at?: string | null
          first_recharge_completed_at?: string | null
          step?: number
          user_id?: string
        }
        Relationships: []
      }
      overcharge_flags: {
        Row: {
          contributing_batteries: Json
          dismissed: boolean
          dismissed_at: string | null
          id: string
          is_flagged: boolean
          session_id: string
        }
        Insert: {
          contributing_batteries?: Json
          dismissed?: boolean
          dismissed_at?: string | null
          id: string
          is_flagged?: boolean
          session_id: string
        }
        Update: {
          contributing_batteries?: Json
          dismissed?: boolean
          dismissed_at?: string | null
          id?: string
          is_flagged?: boolean
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_verified: boolean
          consent_status: string
          content_pathway: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          notification_settings: Json
          onboarding_step: number
          preferences: Json
          privacy_settings: Json
          role: string
          soft_deleted_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          age_verified?: boolean
          consent_status?: string
          content_pathway?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          notification_settings?: Json
          onboarding_step?: number
          preferences?: Json
          privacy_settings?: Json
          role?: string
          soft_deleted_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          age_verified?: boolean
          consent_status?: string
          content_pathway?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          notification_settings?: Json
          onboarding_step?: number
          preferences?: Json
          privacy_settings?: Json
          role?: string
          soft_deleted_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      recharge_actions: {
        Row: {
          accessibility_variations: string | null
          battery_id: string
          chapter_source: string | null
          duration_tier: string
          health_caution: string | null
          id: string
          instructions: string
          is_fixture: boolean
          mode_suitability: Json
          plan_a_text: string
          plan_b_text: string
          signal_id: string | null
          workflow_status: string
        }
        Insert: {
          accessibility_variations?: string | null
          battery_id: string
          chapter_source?: string | null
          duration_tier: string
          health_caution?: string | null
          id: string
          instructions?: string
          is_fixture?: boolean
          mode_suitability?: Json
          plan_a_text?: string
          plan_b_text?: string
          signal_id?: string | null
          workflow_status?: string
        }
        Update: {
          accessibility_variations?: string | null
          battery_id?: string
          chapter_source?: string | null
          duration_tier?: string
          health_caution?: string | null
          id?: string
          instructions?: string
          is_fixture?: boolean
          mode_suitability?: Json
          plan_a_text?: string
          plan_b_text?: string
          signal_id?: string | null
          workflow_status?: string
        }
        Relationships: []
      }
      recharge_plans: {
        Row: {
          battery_id: string
          cue: string
          id: string
          plan_a_action_id: string | null
          plan_b_action_id: string | null
          review_date: string | null
          start_date: string
          support_action: string
          user_id: string
          warning_light: string
        }
        Insert: {
          battery_id: string
          cue?: string
          id: string
          plan_a_action_id?: string | null
          plan_b_action_id?: string | null
          review_date?: string | null
          start_date?: string
          support_action?: string
          user_id: string
          warning_light?: string
        }
        Update: {
          battery_id?: string
          cue?: string
          id?: string
          plan_a_action_id?: string | null
          plan_b_action_id?: string | null
          review_date?: string | null
          start_date?: string
          support_action?: string
          user_id?: string
          warning_light?: string
        }
        Relationships: []
      }
      recommendation_lookups: {
        Row: {
          battery_id: string
          duration_tier: string
          id: string
          is_fixture: boolean
          mode: string
          recharge_action_id: string
          signal_id: string | null
          sort_order: number
          time_of_day: string
          workflow_status: string
        }
        Insert: {
          battery_id: string
          duration_tier: string
          id: string
          is_fixture?: boolean
          mode: string
          recharge_action_id: string
          signal_id?: string | null
          sort_order?: number
          time_of_day?: string
          workflow_status?: string
        }
        Update: {
          battery_id?: string
          duration_tier?: string
          id?: string
          is_fixture?: boolean
          mode?: string
          recharge_action_id?: string
          signal_id?: string | null
          sort_order?: number
          time_of_day?: string
          workflow_status?: string
        }
        Relationships: []
      }
      response_scales: {
        Row: {
          id: string
          labels: Json
          max_value: number | null
          min_value: number | null
          name: string
          stored_type: string
        }
        Insert: {
          id: string
          labels?: Json
          max_value?: number | null
          min_value?: number | null
          name: string
          stored_type: string
        }
        Update: {
          id?: string
          labels?: Json
          max_value?: number | null
          min_value?: number | null
          name?: string
          stored_type?: string
        }
        Relationships: []
      }
      restart_rail_events: {
        Row: {
          action: string | null
          id: string
          missed_at: string
          returned_at: string | null
          used_plan_b: boolean
          user_id: string
        }
        Insert: {
          action?: string | null
          id: string
          missed_at?: string
          returned_at?: string | null
          used_plan_b?: boolean
          user_id: string
        }
        Update: {
          action?: string | null
          id?: string
          missed_at?: string
          returned_at?: string | null
          used_plan_b?: boolean
          user_id?: string
        }
        Relationships: []
      }
      scan_recommendations: {
        Row: {
          id: string
          ratings: Json
          recommended_battery_id: string | null
          session_id: string
          set_at: string
          user_id: string
        }
        Insert: {
          id: string
          ratings?: Json
          recommended_battery_id?: string | null
          session_id: string
          set_at?: string
          user_id: string
        }
        Update: {
          id?: string
          ratings?: Json
          recommended_battery_id?: string | null
          session_id?: string
          set_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scoring_thresholds: {
        Row: {
          description: string
          dimension: string
          id: string
          is_provisional: boolean
          level_name: string
          max_value: number | null
          min_value: number | null
        }
        Insert: {
          description?: string
          dimension: string
          id: string
          is_provisional?: boolean
          level_name: string
          max_value?: number | null
          min_value?: number | null
        }
        Update: {
          description?: string
          dimension?: string
          id?: string
          is_provisional?: boolean
          level_name?: string
          max_value?: number | null
          min_value?: number | null
        }
        Relationships: []
      }
      signal_count_logs: {
        Row: {
          batteries_showing_signal: Json
          id: string
          logged_at: string
          session_id: string
          signal_count: number
          suggested_mode: string
          user_id: string
        }
        Insert: {
          batteries_showing_signal?: Json
          id: string
          logged_at?: string
          session_id: string
          signal_count: number
          suggested_mode: string
          user_id: string
        }
        Update: {
          batteries_showing_signal?: Json
          id?: string
          logged_at?: string
          session_id?: string
          signal_count?: number
          suggested_mode?: string
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          battery_id: string
          channel: string
          description: string
          id: string
          related_recharge_ids: Json
          severity: string
        }
        Insert: {
          battery_id: string
          channel: string
          description?: string
          id: string
          related_recharge_ids?: Json
          severity: string
        }
        Update: {
          battery_id?: string
          channel?: string
          description?: string
          id?: string
          related_recharge_ids?: Json
          severity?: string
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          kind: string
          payload?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      threshold_audit_log: {
        Row: {
          after: Json
          before: Json
          changed_at: string
          changed_by_role: string
          changed_by_user_id: string
          id: string
          threshold_id: string
        }
        Insert: {
          after: Json
          before: Json
          changed_at?: string
          changed_by_role: string
          changed_by_user_id: string
          id: string
          threshold_id: string
        }
        Update: {
          after?: Json
          before?: Json
          changed_at?: string
          changed_by_role?: string
          changed_by_user_id?: string
          id?: string
          threshold_id?: string
        }
        Relationships: []
      }
      tune_ups: {
        Row: {
          battery_id: string
          daily_action_id: string | null
          id: string
          interval_days: number
          review_date: string | null
          review_outcomes: Json
          start_date: string
          support_action: string | null
          user_id: string
          warning_light: string
          win_definition: string | null
        }
        Insert: {
          battery_id: string
          daily_action_id?: string | null
          id: string
          interval_days: number
          review_date?: string | null
          review_outcomes?: Json
          start_date?: string
          support_action?: string | null
          user_id: string
          warning_light?: string
          win_definition?: string | null
        }
        Update: {
          battery_id?: string
          daily_action_id?: string | null
          id?: string
          interval_days?: number
          review_date?: string | null
          review_outcomes?: Json
          start_date?: string
          support_action?: string | null
          user_id?: string
          warning_light?: string
          win_definition?: string | null
        }
        Relationships: []
      }
      workflow_events: {
        Row: {
          action: string
          actor_role: string
          actor_user_id: string
          at: string
          collection: string
          from_status: string
          id: string
          record_id: string
          to_status: string
        }
        Insert: {
          action: string
          actor_role: string
          actor_user_id: string
          at?: string
          collection: string
          from_status: string
          id: string
          record_id: string
          to_status: string
        }
        Update: {
          action?: string
          actor_role?: string
          actor_user_id?: string
          at?: string
          collection?: string
          from_status?: string
          id?: string
          record_id?: string
          to_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
