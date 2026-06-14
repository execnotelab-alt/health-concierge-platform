export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          full_name: string | null
          date_of_birth: string | null
          sex: string | null
          phone: string | null
          email: string | null
          address_line1: string | null
          address_city: string | null
          address_state: string | null
          address_zip: string | null
          health_goals: string[] | null
          known_conditions: string[] | null
          medications: string[] | null
          supplements: string[] | null
          allergies: string[] | null
          family_history: string | null
          exercise_routine: string | null
          scheduling_pref_times: string | null
          scheduling_pref_days_avoid: string | null
          scheduling_max_drive_minutes: number | null
          scheduling_location_pref: string | null
          calendar_integration: string | null
          communication_channel: string | null
          nudge_style: string | null
          status: string | null
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'full_name' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      insurance_policies: {
        Row: {
          id: string
          client_id: string
          type: string
          carrier: string
          plan_name: string | null
          plan_codes: string | null
          member_id: string | null
          group_number: string | null
          issuer: string | null
          network: string | null
          effective_date: string | null
          portal_url: string | null
          customer_service_phone: string | null
          claims_address: string | null
          administered_via: string | null
          rx_bin: string | null
          rx_pcn: string | null
          rx_group: string | null
          cost_share: Json | null
          deductibles: Json | null
          oop_max: Json | null
          notes: string | null
          card_front_url: string | null
          card_back_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['insurance_policies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['insurance_policies']['Insert']>
      }
      providers: {
        Row: {
          id: string
          client_id: string
          name: string
          credentials: string | null
          specialty: string
          practice_name: string | null
          address: string | null
          phone: string | null
          portal_url: string | null
          portal_username_encrypted: string | null
          portal_password_encrypted: string | null
          scheduling_url: string | null
          scheduling_method: string | null
          insurance_to_use: string | null
          last_visit: string | null
          next_due: string | null
          next_due_notes: string | null
          status: string | null
          priority: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['providers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['providers']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          provider_id: string | null
          provider_name: string | null
          practice_name: string | null
          appointment_type: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          duration_minutes: number | null
          status: string
          outcome: string | null
          next_steps: string | null
          next_due: string | null
          prep_notes: string | null
          booked_via: string | null
          insurance_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      care_plan_items: {
        Row: {
          id: string
          client_id: string
          category: string
          item_name: string
          frequency: string | null
          last_completed: string | null
          next_due: string | null
          next_due_notes: string | null
          status: string
          provider_name: string | null
          notes: string | null
          trigger_age: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['care_plan_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['care_plan_items']['Insert']>
      }
      immunizations: {
        Row: {
          id: string
          client_id: string
          vaccine_name: string
          last_received: string | null
          last_received_approx: string | null
          frequency: string | null
          next_due: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['immunizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['immunizations']['Insert']>
      }
      rules: {
        Row: {
          id: string
          category: string
          name: string
          description: string
          rule_text: string
          enabled: boolean
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rules']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          client_id: string
          session_id: string | null
          role: string
          content: string
          visibility: string
          message_type: string | null
          tool_name: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      activity_log: {
        Row: {
          id: string
          client_id: string
          action_type: string
          description: string
          outcome: string | null
          performed_at: string
          metadata: Json | null
        }
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'performed_at'>
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
      }
    }
  }
}

export type Client = Database['public']['Tables']['clients']['Row']
export type InsurancePolicy = Database['public']['Tables']['insurance_policies']['Row']
export type Provider = Database['public']['Tables']['providers']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type CarePlanItem = Database['public']['Tables']['care_plan_items']['Row']
export type Immunization = Database['public']['Tables']['immunizations']['Row']
export type Rule = Database['public']['Tables']['rules']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']
