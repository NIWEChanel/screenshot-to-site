import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import hero from "@/assets/prop-villa.jpg";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { useI18n } from "@/lib/i18n";
import { lookupsQuery, publicPropertiesQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REBERO — Homes, land & property in Rwanda" },
      { name: "description", content: "Browse approved homes, apartments, land and commercial property across Kigali, Musanze, Rubavu, Huye and more." },
      { property: "og:title", content: "REBERO — Homes, land & property in Rwanda" },
      { property: "og:description", content: "Browse approved property listings from trusted Rwandan commissioners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const props = useQuery(publicPropertiesQuery);
  const lookups = useQuery(lookupsQuery);
  const featured = (props.data ?? []).filter((p) => p.featured && p.status === "approved").slice(0, 6);

  return (
    <main>
      <section className="relative isolate min-h-[560px] overflow-hidden">
        <img src={hero} alt="" width={1280} height={832} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto flex max-w-7xl flex-col justify-end px-4 pb-16 pt-40 text-primary-foreground">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sand">Rwanda · RWF</p>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] md:text-6xl">{t("heroTitle")}</h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">{t("heroSub")}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/properties", search: { q: q || undefined } });
            }}
            className="mt-8 flex max-w-xl gap-2 rounded-2xl bg-card p-2 shadow-warm"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPh")}
              className="flex-1 bg-transparent px-3 text-foreground outline-none"
            />
            <Button variant="clay" size="lg" type="submit">
              <Search /> {t("search")}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-3xl font-bold">{t("featured")}</h2>
          <Link to="/properties" search={{}} className="text-sm font-semibold text-clay hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold">{t("categories")}</h2>
            <div className="flex flex-wrap gap-2">
              {lookups.data?.categories.map((c) => (
                <Link key={c.id} to="/properties" search={{ category: c.id }} className="rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-clay hover:text-clay">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold">{t("locations")}</h2>
            <div className="flex flex-wrap gap-2">
              {lookups.data?.locations.map((l) => (
                <Link key={l.id} to="/properties" search={{ location: l.id }} className="rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-clay hover:text-clay">
                  {l.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© REBERO · Rwanda real estate marketplace</footer>
    </main>
  );
}
