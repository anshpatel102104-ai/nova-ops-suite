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
      assets: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          source_run_id: string | null
          tags: string[]
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          source_run_id?: string | null
          tags?: string[]
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          source_run_id?: string | null
          tags?: string[]
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_source_run_id_fkey"
            columns: ["source_run_id"]
            isOneToOne: false
            referencedRelation: "tool_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      nova_system_configs: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          id: string
          last_run_at: string | null
          system_slug: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          last_run_at?: string | null
          system_slug: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          last_run_at?: string | null
          system_slug?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nova_system_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_workspace_id: string | null
          full_name: string | null
          id: string
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_workspace_id?: string | null
          full_name?: string | null
          id: string
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_workspace_id?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      tool_runs: {
        Row: {
          agent_slug: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input: string
          model: string | null
          output: string | null
          provider: Database["public"]["Enums"]["ai_provider"] | null
          status: Database["public"]["Enums"]["tool_run_status"]
          tool_slug: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          agent_slug?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input: string
          model?: string | null
          output?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"] | null
          status?: Database["public"]["Enums"]["tool_run_status"]
          tool_slug: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          agent_slug?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: string
          model?: string | null
          output?: string | null
          provider?: Database["public"]["Enums"]["ai_provider"] | null
          status?: Database["public"]["Enums"]["tool_run_status"]
          tool_slug?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          created_at: string
          current_step: number
          error: string | null
          id: string
          input: string
          status: Database["public"]["Enums"]["workflow_run_status"]
          steps: Json
          total_duration_ms: number | null
          updated_at: string
          user_id: string
          workflow_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          error?: string | null
          id?: string
          input?: string
          status?: Database["public"]["Enums"]["workflow_run_status"]
          steps?: Json
          total_duration_ms?: number | null
          updated_at?: string
          user_id: string
          workflow_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_step?: number
          error?: string | null
          id?: string
          input?: string
          status?: Database["public"]["Enums"]["workflow_run_status"]
          steps?: Json
          total_duration_ms?: number | null
          updated_at?: string
          user_id?: string
          workflow_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          agent_slug: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_template: boolean
          name: string
          steps: Json
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agent_slug?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_template?: boolean
          name: string
          steps?: Json
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agent_slug?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_template?: boolean
          name?: string
          steps?: Json
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_provider_keys: {
        Row: {
          created_at: string
          created_by: string
          id: string
          key_hint: string
          provider: Database["public"]["Enums"]["ai_provider"]
          updated_at: string
          vault_secret_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          key_hint: string
          provider: Database["public"]["Enums"]["ai_provider"]
          updated_at?: string
          vault_secret_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          key_hint?: string
          provider?: Database["public"]["Enums"]["ai_provider"]
          updated_at?: string
          vault_secret_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_provider_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_usage: {
        Row: {
          created_at: string
          id: string
          period_start: string
          tool_runs: number
          updated_at: string
          workflow_runs: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_start: string
          tool_runs?: number
          updated_at?: string
          workflow_runs?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_start?: string
          tool_runs?: number
          updated_at?: string
          workflow_runs?: number
          workspace_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          default_model: string | null
          default_provider: Database["public"]["Enums"]["ai_provider"] | null
          id: string
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["workspace_plan"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_model?: string | null
          default_provider?: Database["public"]["Enums"]["ai_provider"] | null
          id?: string
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["workspace_plan"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_model?: string | null
          default_provider?: Database["public"]["Enums"]["ai_provider"] | null
          id?: string
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["workspace_plan"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: string }
      check_and_increment_usage: {
        Args: { _kind: string; _workspace_id: string }
        Returns: Json
      }
      delete_provider_key: {
        Args: {
          _provider: Database["public"]["Enums"]["ai_provider"]
          _workspace_id: string
        }
        Returns: undefined
      }
      get_plan_limits: {
        Args: { _plan: Database["public"]["Enums"]["workspace_plan"] }
        Returns: Json
      }
      get_provider_key_plaintext: {
        Args: {
          _provider: Database["public"]["Enums"]["ai_provider"]
          _workspace_id: string
        }
        Returns: string
      }
      get_workspace_members: {
        Args: { _workspace_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          is_owner: boolean
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      set_provider_key: {
        Args: {
          _plaintext: string
          _provider: Database["public"]["Enums"]["ai_provider"]
          _workspace_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      ai_provider: "anthropic" | "openai"
      app_role: "admin" | "moderator" | "user"
      asset_type:
        | "offer"
        | "script"
        | "proposal"
        | "campaign"
        | "content"
        | "workflow"
        | "other"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      tool_run_status: "pending" | "running" | "succeeded" | "failed"
      workflow_run_status: "pending" | "running" | "succeeded" | "failed"
      workspace_plan:
        | "starter"
        | "launch"
        | "scale"
        | "enterprise"
        | "pro"
        | "business"
      workspace_role: "owner" | "admin" | "member"
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
      ai_provider: ["anthropic", "openai"],
      app_role: ["admin", "moderator", "user"],
      asset_type: [
        "offer",
        "script",
        "proposal",
        "campaign",
        "content",
        "workflow",
        "other",
      ],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      tool_run_status: ["pending", "running", "succeeded", "failed"],
      workflow_run_status: ["pending", "running", "succeeded", "failed"],
      workspace_plan: [
        "starter",
        "launch",
        "scale",
        "enterprise",
        "pro",
        "business",
      ],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const
