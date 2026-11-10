import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PROPERTY_SELECT =
  "*, categories(name), locations(name), commissioners(id,name,phone,whatsapp,avatar_url)";

export type PropertyRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  listing_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  images: string[];
  status: string;
  featured: boolean;
  views: number;
  rejection_reason: string | null;
  category_id: string | null;
  location_id: string | null;
  commissioner_id: string;
  created_at: string;
  categories: { name: string } | null;
  locations: { name: string } | null;
  commissioners: { id: string; name: string; phone: string; whatsapp: string; avatar_url: string | null } | null;
};

export const lookupsQuery = queryOptions({
  queryKey: ["lookups"],
  queryFn: async () => {
    const [c, l, p] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("locations").select("*").order("name"),
      supabase.from("plans").select("*").order("price"),
    ]);
    return { categories: c.data ?? [], locations: l.data ?? [], plans: p.data ?? [] };
  },
});

export const publicPropertiesQuery = queryOptions({
  queryKey: ["public-properties"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_SELECT)
      .in("status", ["approved", "sold", "rented"])
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as PropertyRow[];
  },
});
