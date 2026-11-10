import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { lookupsQuery, publicPropertiesQuery } from "@/lib/queries";

type Search = {
  q?: string | undefined;
  category?: string | undefined;
  location?: string | undefined;
  type?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  beds?: number | undefined;
  sort?: string | undefined;
};

export const Route = createFileRoute("/properties/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s['q'] === "string" ? s.q : undefined,
    category: typeof s['category'] === "string" ? s.category : undefined,
    location: typeof s['location'] === "string" ? s.location : undefined,
    type: typeof s['type'] === "string" ? s.type : undefined,
    min: s['min'] ? Number(s['min']) : undefined,
    max: s['max'] ? Number(s['max']) : undefined,
    beds: s['beds'] ? Number(s['beds']) : undefined,
    sort: typeof s['sort'] === "string" ? s.sort : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse properties — REBERO" },
      { name: "description", content: "Search and filter homes, apartments, land and commercial property for sale or rent in Rwanda." },
      { property: "og:title", content: "Browse properties — REBERO" },
      { property: "og:description", content: "Search and filter property listings across Rwanda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Browse,
});

function Browse() {
  const { t } = useI18n();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/properties/" });
  const set = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const props = useQuery(publicPropertiesQuery);
  const lookups = useQuery(lookupsQuery);

  let list = (props.data ?? []).filter((p) => {
    if (s.q) {
      const q = s.q.toLowerCase();
      if (!`${p.title} ${p.description} ${p.locations?.name}`.toLowerCase().includes(q)) return false;
    }
    if (s.category && p.category_id !== s.category) return false;
    if (s.location && p.location_id !== s.location) return false;
    if (s.type && p.listing_type !== s.type) return false;
    if (s.min && p.price < s.min) return false;
    if (s.max && p.price > s.max) return false;
    if (s.beds && p.bedrooms < s.beds) return false;
    return true;
  });
  list = [...list].sort((a, b) => {
    if (s.sort === "price_asc") return a.price - b.price;
    if (s.sort === "price_desc") return b.price - a.price;
    if (s.sort === "views") return b.views - a.views;
    return b.created_at.localeCompare(a.created_at);
  });

  const sel = "h-9 rounded-md border bg-card px-2 text-sm";
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-4xl font-bold">{t("browse")}</h1>
      <div className="mb-8 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder={t("searchPh")} defaultValue={s.q} onChange={(e) => set({ q: e.target.value || undefined })} />
        <select className={sel} value={s['category'] ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
          <option value="">{t("allCategories")}</option>
          {lookups.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={sel} value={s['location'] ?? ""} onChange={(e) => set({ location: e.target.value || undefined })}>
          <option value="">{t("allLocations")}</option>
          {lookups.data?.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className={sel} value={s['type'] ?? ""} onChange={(e) => set({ type: e.target.value || undefined })}>
          <option value="">{t("any")}</option>
          <option value="sale">{t("forSale")}</option>
          <option value="rent">{t("forRent")}</option>
        </select>
        <Input type="number" placeholder={`${t("minPrice")} (RWF)`} defaultValue={s.min} onChange={(e) => set({ min: e.target.value ? Number(e.target.value) : undefined })} />
        <Input type="number" placeholder={`${t("maxPrice")} (RWF)`} defaultValue={s.max} onChange={(e) => set({ max: e.target.value ? Number(e.target.value) : undefined })} />
        <select className={sel} value={s['beds'] ?? ""} onChange={(e) => set({ beds: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">{t("minBeds")}: {t("any")}</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
        <select className={sel} value={s['sort'] ?? ""} onChange={(e) => set({ sort: e.target.value || undefined })}>
          <option value="">{t("sort")}: {t("newest")}</option>
          <option value="price_asc">{t("priceLow")}</option>
          <option value="price_desc">{t("priceHigh")}</option>
          <option value="views">{t("popular")}</option>
        </select>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{list.length} {t("results")}</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <PropertyCard key={p.id} p={p} />)}
      </div>
    </main>
  );
}
