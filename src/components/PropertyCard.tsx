import { Link } from "@tanstack/react-router";
import { BedDouble, Bath, MapPin, Star } from "lucide-react";
import { imageUrl, rwf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PropertyRow } from "@/lib/queries";

export function PropertyCard({ p }: { p: PropertyRow }) {
  const { t } = useI18n();
  return (
    <Link
      to="/properties/$id"
      params={{ id: p.id }}
      className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-warm"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl(p.images[0])}
          alt={p.title}
          loading="lazy"
          width={1280}
          height={832}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold">
            {p.listing_type === "rent" ? t("forRent") : t("forSale")}
          </span>
          {p.featured && (
            <span className="flex items-center gap-1 rounded-full bg-clay px-2.5 py-1 text-xs font-semibold text-clay-foreground">
              <Star className="h-3 w-3" /> Featured
            </span>
          )}
          {(p.status === "sold" || p.status === "rented") && (
            <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold uppercase text-background">
              {p.status}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 p-4">
        <p className="font-display text-lg font-bold text-clay">
          {rwf(p.price)}
          {p.listing_type === "rent" && <span className="text-sm font-normal text-muted-foreground"> /mo</span>}
        </p>
        <h3 className="line-clamp-1 font-sans text-base font-semibold">{p.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {p.locations?.name} · {p.categories?.name}
        </p>
        {p.bedrooms > 0 && (
          <p className="flex gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {p.bedrooms} {t("beds")}</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {p.bathrooms} {t("baths")}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
