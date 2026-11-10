import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bath, BedDouble, Eye, MapPin, Maximize, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { imageUrl, rwf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { PROPERTY_SELECT, publicPropertiesQuery, type PropertyRow } from "@/lib/queries";

export const Route = createFileRoute("/properties/$id")({
  head: () => ({
    meta: [
      { title: "Property details — REBERO" },
      { name: "description", content: "Photos, price, features and commissioner contact for this Rwanda property." },
      { property: "og:title", content: "Property details — REBERO" },
      { property: "og:description", content: "View this property listing on REBERO." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const q = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select(PROPERTY_SELECT).eq("id", id).maybeSingle();
      return data as unknown as PropertyRow | null;
    },
  });
  const all = useQuery(publicPropertiesQuery);
  useEffect(() => {
    supabase.rpc("increment_view", { _id: id });
    setActive(0);
  }, [id]);

  const p = q.data;
  if (q.isLoading) return <main className="p-10 text-center text-muted-foreground">Loading…</main>;
  if (!p) return <main className="p-10 text-center">Property not found.</main>;
  const similar = (all.data ?? [])
    .filter((x) => x.id !== p.id && (x.category_id === p.category_id || x.location_id === p.location_id))
    .slice(0, 3);
  const c = p.commissioners;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <img src={imageUrl(p.images[active])} alt={p.title} width={1280} height={832} className="aspect-[16/10] w-full rounded-2xl object-cover" />
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {p.images.map((img, i) => (
              <button key={i} onClick={() => setActive(i)} className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-clay" : "border-transparent"}`}>
                <img src={imageUrl(img)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <h1 className="mt-6 text-4xl font-bold">{p.title}</h1>
          <p className="mt-2 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> {p.locations?.name} · {p.categories?.name}</p>
          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            {p.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {p.bedrooms} {t("beds")}</span>}
            {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {p.bathrooms} {t("baths")}</span>}
            <span className="flex items-center gap-1"><Maximize className="h-4 w-4" /> {p.area_sqm.toLocaleString()} m²</span>
            <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {p.views}</span>
          </div>
          <p className="mt-6 whitespace-pre-line leading-relaxed">{p.description}</p>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-6 shadow-warm lg:sticky lg:top-24">
          <p className="font-display text-3xl font-bold text-clay">{rwf(p.price)}{p.listing_type === "rent" && <span className="text-base font-normal text-muted-foreground"> /mo</span>}</p>
          {(p.status === "sold" || p.status === "rented") && <p className="rounded-md bg-muted px-3 py-2 text-sm font-semibold uppercase">{p.status}</p>}
          {c && (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("listedBy")}</p>
              <Link to="/commissioners/$id" params={{ id: c.id }} className="flex items-center gap-3 hover:text-clay">
                <img src={c.avatar_url ?? ""} alt={c.name} className="h-12 w-12 rounded-full object-cover" />
                <span className="font-semibold">{c.name}</span>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="default"><a href={`tel:${c.phone}`}><Phone /> {t("call")}</a></Button>
                <Button asChild variant="whatsapp">
                  <a href={`https://wa.me/${c.whatsapp}?text=${encodeURIComponent(`Hello, I'm interested in "${p.title}" on REBERO`)}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-bold">{t("similar")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similar.map((x) => <PropertyCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </main>
  );
}
