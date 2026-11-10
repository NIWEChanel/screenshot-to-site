import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { useI18n } from "@/lib/i18n";
import { publicPropertiesQuery } from "@/lib/queries";

export const Route = createFileRoute("/commissioners/$id")({
  head: () => ({
    meta: [
      { title: "Commissioner profile — REBERO" },
      { name: "description", content: "Meet this REBERO commissioner and browse their property listings in Rwanda." },
      { property: "og:title", content: "Commissioner profile — REBERO" },
      { property: "og:description", content: "Trusted property commissioner on REBERO." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const c = useQuery({
    queryKey: ["commissioner", id],
    queryFn: async () => (await supabase.from("commissioners").select("*").eq("id", id).maybeSingle()).data,
  });
  const props = useQuery(publicPropertiesQuery);
  if (c.isLoading) return <main className="p-10 text-center text-muted-foreground">Loading…</main>;
  if (!c.data) return <main className="p-10 text-center">Commissioner not found.</main>;
  const list = (props.data ?? []).filter((p) => p.commissioner_id === id);
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col items-start gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
        <img src={c.data.avatar_url ?? ""} alt={c.data.name} className="h-28 w-28 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{c.data.name}</h1>
          <p className="mt-2 text-muted-foreground">{c.data.bio}</p>
          <p className="mt-1 text-sm">{list.length} listings</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><a href={`tel:${c.data.phone}`}><Phone /> {t("call")}</a></Button>
          <Button asChild variant="whatsapp"><a href={`https://wa.me/${c.data.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
        </div>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
    </main>
  );
}
