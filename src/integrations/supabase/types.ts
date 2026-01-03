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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atendimentos: {
        Row: {
          closer: string
          created_at: string
          data_call: string
          email: string | null
          gravacao: string | null
          id: string
          info_sdr: string | null
          nome: string
          origem: string
          sdr: string
          status: string
          telefone: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          closer: string
          created_at?: string
          data_call?: string
          email?: string | null
          gravacao?: string | null
          id?: string
          info_sdr?: string | null
          nome: string
          origem: string
          sdr: string
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          closer?: string
          created_at?: string
          data_call?: string
          email?: string | null
          gravacao?: string | null
          id?: string
          info_sdr?: string | null
          nome?: string
          origem?: string
          sdr?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: []
      }
      closers: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          time_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          time_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          time_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "closers_time_id_fkey"
            columns: ["time_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_disparo: {
        Row: {
          abordados: number
          agendados: number
          closer_id: string
          compareceram: number
          confirmados: number
          created_at: string
          data: string
          id: string
          observacoes: string | null
          receita: number
          updated_at: string
          vendas: number
        }
        Insert: {
          abordados?: number
          agendados?: number
          closer_id: string
          compareceram?: number
          confirmados?: number
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          receita?: number
          updated_at?: string
          vendas?: number
        }
        Update: {
          abordados?: number
          agendados?: number
          closer_id?: string
          compareceram?: number
          confirmados?: number
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          receita?: number
          updated_at?: string
          vendas?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_disparo_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_sdr: {
        Row: {
          abordados: number
          agendamentos: number
          created_at: string
          data: string
          id: string
          observacoes: string | null
          responderam: number
          sdr_id: string
          updated_at: string
          vendas_agendamentos: number
        }
        Insert: {
          abordados?: number
          agendamentos?: number
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          responderam?: number
          sdr_id: string
          updated_at?: string
          vendas_agendamentos?: number
        }
        Update: {
          abordados?: number
          agendamentos?: number
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          responderam?: number
          sdr_id?: string
          updated_at?: string
          vendas_agendamentos?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_sdr_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "sdrs"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_trafego: {
        Row: {
          abordados: number
          agendados: number
          closer_id: string
          compareceram: number
          confirmados: number
          created_at: string
          data: string
          id: string
          observacoes: string | null
          receita: number
          updated_at: string
          vendas: number
        }
        Insert: {
          abordados?: number
          agendados?: number
          closer_id: string
          compareceram?: number
          confirmados?: number
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          receita?: number
          updated_at?: string
          vendas?: number
        }
        Update: {
          abordados?: number
          agendados?: number
          closer_id?: string
          compareceram?: number
          confirmados?: number
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          receita?: number
          updated_at?: string
          vendas?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_trafego_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
        ]
      }
      lideres_comerciais: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          time_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          time_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          time_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lideres_comerciais_time_id_fkey"
            columns: ["time_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
        ]
      }
      origens: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          closer_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          sdr_id: string | null
          time_id: string | null
        }
        Insert: {
          ativo?: boolean
          closer_id?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          sdr_id?: string | null
          time_id?: string | null
        }
        Update: {
          ativo?: boolean
          closer_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          sdr_id?: string | null
          time_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "sdrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_time_id_fkey"
            columns: ["time_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
        ]
      }
      sdrs: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          time_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          time_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          time_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdrs_time_id_fkey"
            columns: ["time_id"]
            isOneToOne: false
            referencedRelation: "times"
            referencedColumns: ["id"]
          },
        ]
      }
      times: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vendas_registro: {
        Row: {
          closer_id: string
          created_at: string
          data: string
          id: string
          ticket: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          closer_id: string
          created_at?: string
          data?: string
          id?: string
          ticket: string
          tipo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          closer_id?: string
          created_at?: string
          data?: string
          id?: string
          ticket?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_registro_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "lider" | "vendedor" | "sdr"
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
      app_role: ["admin", "user", "lider", "vendedor", "sdr"],
    },
  },
} as const
