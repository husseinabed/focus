import { Database as DB } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          phone: string | null;
          default_language: string | null;
        };
        Insert: {
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          default_language?: string | null;
        };
        Update: {
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          default_language?: string | null;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          default_locale: "he" | "ar" | "en";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          default_locale?: "he" | "ar" | "en";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          default_locale?: "he" | "ar" | "en";
          created_by?: string;
          created_at?: string;
        };
      };
      meetings: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          end_time: string;
          id: string;
          lead_id: string;
          meeting_url: string | null;
          provider: "zoom" | "google_meet" | "manual";
          start_time: string;
          status: "scheduled" | "completed" | "canceled" | "no_show";
          timezone: string;
          title: string;
          type: "qualification" | "proposal" | "followup";
          updated_at: string;
          workflow_run_id: string | null;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          end_time: string;
          id?: string;
          lead_id: string;
          meeting_url?: string | null;
          provider: "zoom" | "google_meet" | "manual";
          start_time: string;
          status?: "scheduled" | "completed" | "canceled" | "no_show";
          timezone: string;
          title: string;
          type: "qualification" | "proposal" | "followup";
          updated_at?: string;
          workflow_run_id?: string | null;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          end_time?: string;
          id?: string;
          lead_id?: string;
          meeting_url?: string | null;
          provider?: "zoom" | "google_meet" | "manual";
          start_time?: string;
          status?: "scheduled" | "completed" | "canceled" | "no_show";
          timezone?: string;
          title?: string;
          type?: "qualification" | "proposal" | "followup";
          updated_at?: string;
          workflow_run_id?: string | null;
          workspace_id?: string;
        };
      };
      workflows: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          trigger_type: "manual" | "lead_added" | "inbound_reply" | "scheduled";
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          trigger_type: "manual" | "lead_added" | "inbound_reply" | "scheduled";
          is_active?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          trigger_type?: "manual" | "lead_added" | "inbound_reply" | "scheduled";
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
        };
      };
      workflow_versions: {
        Row: {
          id: string;
          workflow_id: string;
          version: number;
          schema_version: number;
          published: boolean;
          graph: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          version: number;
          schema_version: number;
          published?: boolean;
          graph: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          version?: number;
          schema_version?: number;
          published?: boolean;
          graph?: Json;
          created_by?: string;
          created_at?: string;
        };
      };
      workflow_runs: {
        Row: {
          id: string;
          workflow_id: string;
          lead_id: string;
          status: "running" | "completed" | "failed" | "stopped";
          started_at: string;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          lead_id: string;
          status?: "running" | "completed" | "failed" | "stopped";
          started_at?: string;
          finished_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          lead_id?: string;
          status?: "running" | "completed" | "failed" | "stopped";
          started_at?: string;
          finished_at?: string | null;
          created_at?: string;
        };
      };
      workflow_run_events: {
        Row: {
          id: string;
          run_id: string;
          node_id: string;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          node_id: string;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          node_id?: string;
          event_type?: string;
          payload?: Json;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      update_updated_at_meetings: {
        Args: {};
        Returns: Record<string, unknown>;
      };
    };
    Enums: {
      meeting_provider: "zoom" | "google_meet" | "manual";
      meeting_status: "scheduled" | "completed" | "canceled" | "no_show";
      meeting_type: "qualification" | "proposal" | "followup";
    };
    CompositeTypes: {};
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
    PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
    PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
    PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
    PublicSchema["Enums"][T];
