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
      access_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
          user_name: string
          user_role: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
          user_name: string
          user_role: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
          user_name?: string
          user_role?: string
        }
        Relationships: []
      }
      atendimentos: {
        Row: {
          cliente_id: string | null
          closer: string
          created_at: string
          data_call: string
          email: string | null
          google_event_id: string | null
          google_meet_link: string | null
          gravacao: string | null
          hora_call: string | null
          id: string
          info_sdr: string | null
          lead_id: string | null
          nome: string
          origem: string
          sdr: string
          status: string
          telefone: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          cliente_id?: string | null
          closer: string
          created_at?: string
          data_call?: string
          email?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          gravacao?: string | null
          hora_call?: string | null
          id?: string
          info_sdr?: string | null
          lead_id?: string | null
          nome: string
          origem: string
          sdr: string
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string | null
          closer?: string
          created_at?: string
          data_call?: string
          email?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          gravacao?: string | null
          hora_call?: string | null
          id?: string
          info_sdr?: string | null
          lead_id?: string | null
          nome?: string
          origem?: string
          sdr?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
      clientes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clientes_pipeline: {
        Row: {
          cliente_id: string | null
          closer_id: string | null
          closer_nome: string | null
          closer_responsavel_id: string | null
          closer_responsavel_nome: string | null
          created_at: string | null
          data_call: string | null
          data_proximo_contato: string | null
          email: string | null
          empresa: string | null
          etapa_atual: string
          etapa_atualizada_em: string | null
          gravacao: string | null
          hora_call: string | null
          id: string
          info_sdr: string | null
          nome: string
          observacoes: string | null
          origem_id: string | null
          origem_lead: string | null
          origem_nome: string | null
          proximo_passo: string | null
          sdr_id: string | null
          sdr_nome: string | null
          segmento: string | null
          status: string | null
          str_responsavel_id: string
          str_responsavel_nome: string
          temperatura: string | null
          updated_at: string | null
          valor_potencial: number | null
          whatsapp: string
        }
        Insert: {
          cliente_id?: string | null
          closer_id?: string | null
          closer_nome?: string | null
          closer_responsavel_id?: string | null
          closer_responsavel_nome?: string | null
          created_at?: string | null
          data_call?: string | null
          data_proximo_contato?: string | null
          email?: string | null
          empresa?: string | null
          etapa_atual?: string
          etapa_atualizada_em?: string | null
          gravacao?: string | null
          hora_call?: string | null
          id?: string
          info_sdr?: string | null
          nome: string
          observacoes?: string | null
          origem_id?: string | null
          origem_lead?: string | null
          origem_nome?: string | null
          proximo_passo?: string | null
          sdr_id?: string | null
          sdr_nome?: string | null
          segmento?: string | null
          status?: string | null
          str_responsavel_id: string
          str_responsavel_nome: string
          temperatura?: string | null
          updated_at?: string | null
          valor_potencial?: number | null
          whatsapp: string
        }
        Update: {
          cliente_id?: string | null
          closer_id?: string | null
          closer_nome?: string | null
          closer_responsavel_id?: string | null
          closer_responsavel_nome?: string | null
          created_at?: string | null
          data_call?: string | null
          data_proximo_contato?: string | null
          email?: string | null
          empresa?: string | null
          etapa_atual?: string
          etapa_atualizada_em?: string | null
          gravacao?: string | null
          hora_call?: string | null
          id?: string
          info_sdr?: string | null
          nome?: string
          observacoes?: string | null
          origem_id?: string | null
          origem_lead?: string | null
          origem_nome?: string | null
          proximo_passo?: string | null
          sdr_id?: string | null
          sdr_nome?: string | null
          segmento?: string | null
          status?: string | null
          str_responsavel_id?: string
          str_responsavel_nome?: string
          temperatura?: string | null
          updated_at?: string | null
          valor_potencial?: number | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_pipeline_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      closers: {
        Row: {
          ativo: boolean
          bonus_extra: number | null
          comissao_percentual: number | null
          created_at: string
          email: string | null
          google_calendar_connected: boolean | null
          id: string
          nome: string
          time_id: string | null
        }
        Insert: {
          ativo?: boolean
          bonus_extra?: number | null
          comissao_percentual?: number | null
          created_at?: string
          email?: string | null
          google_calendar_connected?: boolean | null
          id?: string
          nome: string
          time_id?: string | null
        }
        Update: {
          ativo?: boolean
          bonus_extra?: number | null
          comissao_percentual?: number | null
          created_at?: string
          email?: string | null
          google_calendar_connected?: boolean | null
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
      comissao_historico: {
        Row: {
          alterado_por: string
          alterado_por_nome: string
          campo_alterado: string
          created_at: string | null
          entidade_id: string
          entidade_nome: string
          entidade_tipo: string
          id: string
          motivo: string | null
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          alterado_por: string
          alterado_por_nome: string
          campo_alterado: string
          created_at?: string | null
          entidade_id: string
          entidade_nome: string
          entidade_tipo: string
          id?: string
          motivo?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          alterado_por?: string
          alterado_por_nome?: string
          campo_alterado?: string
          created_at?: string | null
          entidade_id?: string
          entidade_nome?: string
          entidade_tipo?: string
          id?: string
          motivo?: string | null
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: []
      }
      google_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_tokens_closers: {
        Row: {
          access_token: string
          closer_id: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          token_type: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          closer_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          closer_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_tokens_closers_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: true
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_interacoes: {
        Row: {
          atendimento_id: string | null
          created_at: string | null
          data_interacao: string | null
          descricao: string | null
          id: string
          lead_id: string
          status_anterior: string | null
          status_novo: string | null
          tipo: string
          usuario_nome: string | null
        }
        Insert: {
          atendimento_id?: string | null
          created_at?: string | null
          data_interacao?: string | null
          descricao?: string | null
          id?: string
          lead_id: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo: string
          usuario_nome?: string | null
        }
        Update: {
          atendimento_id?: string | null
          created_at?: string | null
          data_interacao?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo?: string
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_interacoes_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_pipeline: {
        Row: {
          cliente_id: string
          created_at: string | null
          etapa_anterior: string | null
          etapa_nova: string | null
          id: string
          nota: string | null
          tipo: string
          usuario_id: string
          usuario_nome: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          etapa_anterior?: string | null
          etapa_nova?: string | null
          id?: string
          nota?: string | null
          tipo: string
          usuario_id: string
          usuario_nome: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          etapa_anterior?: string | null
          etapa_nova?: string | null
          id?: string
          nota?: string | null
          tipo?: string
          usuario_id?: string
          usuario_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_pipeline_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_pipeline"
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
      lead_ownership_history: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          new_owner_id: string | null
          new_owner_name: string | null
          new_owner_type: string | null
          previous_owner_id: string | null
          previous_owner_name: string | null
          previous_owner_type: string | null
          reason: string | null
          transferred_by: string
          transferred_by_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          new_owner_id?: string | null
          new_owner_name?: string | null
          new_owner_type?: string | null
          previous_owner_id?: string | null
          previous_owner_name?: string | null
          previous_owner_type?: string | null
          reason?: string | null
          transferred_by: string
          transferred_by_name: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          new_owner_id?: string | null
          new_owner_name?: string | null
          new_owner_type?: string | null
          previous_owner_id?: string | null
          previous_owner_name?: string | null
          previous_owner_type?: string | null
          reason?: string | null
          transferred_by?: string
          transferred_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_ownership_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          nome: string
          origem_primeira: string | null
          owner_id: string | null
          owner_type: string | null
          sdr_primeiro: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          nome: string
          origem_primeira?: string | null
          owner_id?: string | null
          owner_type?: string | null
          sdr_primeiro?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          nome?: string
          origem_primeira?: string | null
          owner_id?: string | null
          owner_type?: string | null
          sdr_primeiro?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      lideres_comerciais: {
        Row: {
          ativo: boolean
          bonus_extra: number | null
          comissao_percentual: number | null
          created_at: string
          id: string
          nome: string
          time_id: string | null
        }
        Insert: {
          ativo?: boolean
          bonus_extra?: number | null
          comissao_percentual?: number | null
          created_at?: string
          id?: string
          nome: string
          time_id?: string | null
        }
        Update: {
          ativo?: boolean
          bonus_extra?: number | null
          comissao_percentual?: number | null
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
      metas: {
        Row: {
          bonus_extra: number | null
          campanha_ativa: boolean | null
          campanha_nome: string | null
          comissao_percentual: number | null
          created_at: string | null
          id: string
          mes: string
          meta_agendamentos: number | null
          meta_receita: number | null
          meta_vendas: number | null
          referencia_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          bonus_extra?: number | null
          campanha_ativa?: boolean | null
          campanha_nome?: string | null
          comissao_percentual?: number | null
          created_at?: string | null
          id?: string
          mes: string
          meta_agendamentos?: number | null
          meta_receita?: number | null
          meta_vendas?: number | null
          referencia_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          bonus_extra?: number | null
          campanha_ativa?: boolean | null
          campanha_nome?: string | null
          comissao_percentual?: number | null
          created_at?: string | null
          id?: string
          mes?: string
          meta_agendamentos?: number | null
          meta_receita?: number | null
          meta_vendas?: number | null
          referencia_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notificacoes_config: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          emails_destino: string[] | null
          id: string
          threshold_queda: number | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          emails_destino?: string[] | null
          id?: string
          threshold_queda?: number | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          emails_destino?: string[] | null
          id?: string
          threshold_queda?: number | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notificacoes_historico: {
        Row: {
          assunto: string
          conteudo: string | null
          destinatario: string
          enviado_em: string | null
          id: string
          status: string | null
          tipo: string
        }
        Insert: {
          assunto: string
          conteudo?: string | null
          destinatario: string
          enviado_em?: string | null
          id?: string
          status?: string | null
          tipo: string
        }
        Update: {
          assunto?: string
          conteudo?: string | null
          destinatario?: string
          enviado_em?: string | null
          id?: string
          status?: string | null
          tipo?: string
        }
        Relationships: []
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
          cliente_id: string | null
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
          cliente_id?: string | null
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
          cliente_id?: string | null
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
            foreignKeyName: "profiles_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
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
          bonus_extra: number | null
          comissao_percentual: number | null
          created_at: string
          email: string | null
          id: string
          nome: string
          time_id: string | null
        }
        Insert: {
          ativo?: boolean
          bonus_extra?: number | null
          comissao_percentual?: number | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          time_id?: string | null
        }
        Update: {
          ativo?: boolean
          bonus_extra?: number | null
          comissao_percentual?: number | null
          created_at?: string
          email?: string | null
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
      segmentos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      status_atendimento: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordem: number | null
          sincroniza_etapa: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
          sincroniza_etapa?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          sincroniza_etapa?: string | null
        }
        Relationships: []
      }
      times: {
        Row: {
          ativo: boolean
          cliente_id: string | null
          cor: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "times_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
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
      get_user_cliente_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_in_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_leader: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "lider" | "vendedor" | "sdr" | "cliente"
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
      app_role: ["admin", "user", "lider", "vendedor", "sdr", "cliente"],
    },
  },
} as const
