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
      ai_summaries: {
        Row: {
          client_id: string
          created_at: string
          id: string
          source_range_end: string | null
          source_range_start: string | null
          summary: string
          summary_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          source_range_end?: string | null
          source_range_start?: string | null
          summary: string
          summary_type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          source_range_end?: string | null
          source_range_start?: string | null
          summary?: string
          summary_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          studio_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          studio_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          client_id: string
          created_at: string
          energy_level: number | null
          id: string
          mood: number | null
          notes: string | null
          sleep_hours: number | null
          weight: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          energy_level?: number | null
          id?: string
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          weight?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          energy_level?: number | null
          id?: string
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_subscriptions: {
        Row: {
          client_id: string
          created_at: string
          ends_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          goal: string | null
          id: string
          joined_at: string
          notes: string | null
          status: string
          studio_id: string
          trainer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          goal?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          status?: string
          studio_id: string
          trainer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          goal?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          status?: string
          studio_id?: string
          trainer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          difficulty: string | null
          equipment: string | null
          id: string
          muscle_group: string | null
          name: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          equipment?: string | null
          id?: string
          muscle_group?: string | null
          name: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          equipment?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
        }
        Relationships: []
      }
      measurements: {
        Row: {
          arms: number | null
          chest: number | null
          client_id: string
          created_at: string
          id: string
          legs: number | null
          waist: number | null
          weight: number | null
        }
        Insert: {
          arms?: number | null
          chest?: number | null
          client_id: string
          created_at?: string
          id?: string
          legs?: number | null
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arms?: number | null
          chest?: number | null
          client_id?: string
          created_at?: string
          id?: string
          legs?: number | null
          waist?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          global_role: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          global_role?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          global_role?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_jobs: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          scheduled_for: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_for: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          scheduled_for?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string
          studio_id: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string
          studio_id: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string
          studio_id?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_members: {
        Row: {
          created_at: string
          id: string
          role: string
          studio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          studio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          id: string
          name: string
          price: number
          studio_id: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          id?: string
          name: string
          price: number
          studio_id: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          studio_id: string
          trainer_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          studio_id: string
          trainer_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          studio_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_availability_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_availability_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          day_number: number
          id: string
          notes: string | null
          title: string
          workout_plan_id: string
        }
        Insert: {
          day_number: number
          id?: string
          notes?: string | null
          title: string
          workout_plan_id: string
        }
        Update: {
          day_number?: number
          id?: string
          notes?: string | null
          title?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_items: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          target_weight: string | null
          workout_day_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          target_weight?: string | null
          workout_day_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          target_weight?: string | null
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          client_id: string
          completed_at: string
          difficulty_rating: number | null
          feedback: string | null
          id: string
          workout_day_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string
          difficulty_rating?: number | null
          feedback?: string | null
          id?: string
          workout_day_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string
          difficulty_rating?: number | null
          feedback?: string | null
          id?: string
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          studio_id: string
          title: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          studio_id: string
          title: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          studio_id?: string
          title?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_client: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: boolean
      }
      can_access_workout_day: {
        Args: { p_user_id: string; p_workout_day_id: string }
        Returns: boolean
      }
      can_access_workout_item: {
        Args: { p_user_id: string; p_workout_item_id: string }
        Returns: boolean
      }
      can_access_workout_plan: {
        Args: { p_user_id: string; p_workout_plan_id: string }
        Returns: boolean
      }
      can_manage_client: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: boolean
      }
      can_manage_workout_day: {
        Args: { p_user_id: string; p_workout_day_id: string }
        Returns: boolean
      }
      can_manage_workout_item: {
        Args: { p_user_id: string; p_workout_item_id: string }
        Returns: boolean
      }
      can_manage_workout_plan: {
        Args: { p_user_id: string; p_workout_plan_id: string }
        Returns: boolean
      }
      can_own_client: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: boolean
      }
      is_client_user: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: boolean
      }
      is_studio_member: {
        Args: { p_studio_id: string; p_user_id: string }
        Returns: boolean
      }
      is_studio_owner: {
        Args: { p_studio_id: string; p_user_id: string }
        Returns: boolean
      }
      is_studio_staff: {
        Args: { p_studio_id: string; p_user_id: string }
        Returns: boolean
      }
      shares_studio_with_user: {
        Args: { p_profile_id: string; p_user_id: string }
        Returns: boolean
      }
      workout_day_belongs_to_client: {
        Args: { p_client_id: string; p_workout_day_id: string }
        Returns: boolean
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

