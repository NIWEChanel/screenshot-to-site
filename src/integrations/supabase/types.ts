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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          is_demo: boolean
          name: string
        }
        Insert: {
          id?: string
          is_demo?: boolean
          name: string
        }
        Update: {
          id?: string
          is_demo?: boolean
          name?: string
        }
        Relationships: []
      }
      commissioners: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          email: string
          id: string
          is_demo: boolean
          name: string
          phone: string
          plan_id: string | null
          status: Database["public"]["Enums"]["commissioner_status"]
          sub_end: string | null
          sub_start: string | null
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          email?: string
          id?: string
          is_demo?: boolean
          name: string
          phone?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["commissioner_status"]
          sub_end?: string | null
          sub_start?: string | null
          user_id?: string | null
          whatsapp?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          email?: string
          id?: string
          is_demo?: boolean
          name?: string
          phone?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["commissioner_status"]
          sub_end?: string | null
          sub_start?: string | null
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissioners_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          district: string
          id: string
          is_demo: boolean
          name: string
        }
        Insert: {
          district?: string
          id?: string
          is_demo?: boolean
          name: string
        }
        Update: {
          district?: string
          id?: string
          is_demo?: boolean
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          commissioner_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          message: string
          read: boolean
          user_id: string | null
        }
        Insert: {
          commissioner_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          message: string
          read?: boolean
          user_id?: string | null
        }
        Update: {
          commissioner_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          message?: string
          read?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_commissioner_id_fkey"
            columns: ["commissioner_id"]
            isOneToOne: false
            referencedRelation: "commissioners"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          commissioner_id: string
          created_at: string
          id: string
          is_demo: boolean
          method: string
          note: string | null
          plan_id: string | null
          reference: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount?: number
          commissioner_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          method?: string
          note?: string | null
          plan_id?: string | null
          reference?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          commissioner_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          method?: string
          note?: string | null
          plan_id?: string | null
          reference?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_commissioner_id_fkey"
            columns: ["commissioner_id"]
            isOneToOne: false
            referencedRelation: "commissioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string
          duration_days: number
          id: string
          is_demo: boolean
          max_listings: number
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          is_demo?: boolean
          max_listings?: number
          name: string
          price?: number
        }
        Update: {
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          is_demo?: boolean
          max_listings?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      properties: {
        Row: {
          area_sqm: number
          bathrooms: number
          bedrooms: number
          category_id: string | null
          commissioner_id: string
          created_at: string
          description: string
          featured: boolean
          id: string
          images: string[]
          is_demo: boolean
          listing_type: string
          location_id: string | null
          price: number
          rejection_reason: string | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          views: number
        }
        Insert: {
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          category_id?: string | null
          commissioner_id: string
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          images?: string[]
          is_demo?: boolean
          listing_type?: string
          location_id?: string | null
          price?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          views?: number
        }
        Update: {
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          category_id?: string | null
          commissioner_id?: string
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          images?: string[]
          is_demo?: boolean
          listing_type?: string
          location_id?: string | null
          price?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_commissioner_id_fkey"
            columns: ["commissioner_id"]
            isOneToOne: false
            referencedRelation: "commissioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value?: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view: { Args: { _id: string }; Returns: undefined }
      my_commissioner_id: { Args: never; Returns: string }
      reset_demo_data: { Args: never; Returns: undefined }
      review_payment: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "commissioner" | "client"
      commissioner_status: "pending" | "active" | "suspended" | "rejected"
      payment_status: "pending" | "approved" | "rejected"
      property_status: "pending" | "approved" | "rejected" | "sold" | "rented"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "commissioner", "client"],
      commissioner_status: ["pending", "active", "suspended", "rejected"],
      payment_status: ["pending", "approved", "rejected"],
      property_status: ["pending", "approved", "rejected", "sold", "rented"],
    },
  },
} as const
