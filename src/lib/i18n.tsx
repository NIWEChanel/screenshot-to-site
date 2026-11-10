import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fr" | "rw";

const dict = {
  browse: { en: "Browse", fr: "Parcourir", rw: "Reba amazu" },
  featured: { en: "Featured properties", fr: "Biens en vedette", rw: "Amazu yatoranyijwe" },
  signIn: { en: "Sign in", fr: "Connexion", rw: "Injira" },
  signOut: { en: "Sign out", fr: "Déconnexion", rw: "Sohoka" },
  dashboard: { en: "Dashboard", fr: "Tableau de bord", rw: "Ikibaho" },
  heroTitle: { en: "Find your place in Rwanda", fr: "Trouvez votre place au Rwanda", rw: "Bona aho gutura mu Rwanda" },
  heroSub: {
    en: "Homes, land and commercial spaces from trusted commissioners across the country.",
    fr: "Maisons, terrains et locaux commerciaux par des commissionnaires de confiance.",
    rw: "Amazu, ibibanza n'inyubako z'ubucuruzi ziva ku bakomisiyoneri bizewe.",
  },
  search: { en: "Search", fr: "Rechercher", rw: "Shakisha" },
  searchPh: { en: "Search by title or area…", fr: "Rechercher par titre ou zone…", rw: "Shakisha ukoresheje izina cyangwa agace…" },
  allCategories: { en: "All categories", fr: "Toutes catégories", rw: "Ibyiciro byose" },
  allLocations: { en: "All locations", fr: "Tous les lieux", rw: "Ahantu hose" },
  forSale: { en: "For sale", fr: "À vendre", rw: "Bigurishwa" },
  forRent: { en: "For rent", fr: "À louer", rw: "Bikodeshwa" },
  any: { en: "Any", fr: "Tous", rw: "Byose" },
  sort: { en: "Sort", fr: "Trier", rw: "Tondeka" },
  newest: { en: "Newest", fr: "Plus récents", rw: "Bishya" },
  priceLow: { en: "Price: low to high", fr: "Prix croissant", rw: "Igiciro: gito → kinini" },
  priceHigh: { en: "Price: high to low", fr: "Prix décroissant", rw: "Igiciro: kinini → gito" },
  popular: { en: "Most viewed", fr: "Plus vus", rw: "Byarebwe cyane" },
  call: { en: "Call", fr: "Appeler", rw: "Hamagara" },
  similar: { en: "Similar properties", fr: "Biens similaires", rw: "Amazu asa n'aya" },
  beds: { en: "beds", fr: "ch.", rw: "ibyumba" },
  baths: { en: "baths", fr: "sdb", rw: "ubwiherero" },
  results: { en: "results", fr: "résultats", rw: "ibyabonetse" },
  viewAll: { en: "View all properties", fr: "Voir tous les biens", rw: "Reba amazu yose" },
  categories: { en: "Categories", fr: "Catégories", rw: "Ibyiciro" },
  locations: { en: "Locations", fr: "Lieux", rw: "Ahantu" },
  listedBy: { en: "Listed by", fr: "Publié par", rw: "Byashyizweho na" },
  minPrice: { en: "Min price", fr: "Prix min", rw: "Igiciro gito" },
  maxPrice: { en: "Max price", fr: "Prix max", rw: "Igiciro kinini" },
  minBeds: { en: "Min beds", fr: "Ch. min", rw: "Ibyumba bike" },
} as const;

export type TKey = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("rebero-lang") as Lang | null;
    if (saved && ["en", "fr", "rw"].includes(saved)) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("rebero-lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
