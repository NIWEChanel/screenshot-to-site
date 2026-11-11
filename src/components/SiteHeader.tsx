import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { homeForRoles, useRoles, useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { session } = useSession();
  const roles = useRoles(session?.user.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const home = homeForRoles(roles.data ?? []);
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:flex sm:gap-4">
        <Link to="/" onClick={() => setMenuOpen(false)} className="min-w-0 font-display text-2xl font-bold text-primary">
          REBERO
        </Link>
        <nav className="hidden gap-5 text-sm font-medium sm:flex">
          <Link to="/properties" search={{}} className="hover:text-clay" activeProps={{ className: "text-clay" }}>
            {t("browse")}
          </Link>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="h-11 rounded-md border bg-card px-2 text-sm sm:h-8 sm:text-xs"
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="rw">RW</option>
          </select>
          {session ? (
            <div className="hidden items-center gap-2 sm:flex">
              {home !== "/properties" && (
                <Button asChild size="sm" variant="secondary">
                  <Link to={home}>{t("dashboard")}</Link>
                </Button>
              )}
              <span className="hidden text-xs text-muted-foreground md:inline">{session.user.email}</span>
              <Button size="sm" variant="ghost" onClick={signOut}>
                {t("signOut")}
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" variant="clay">
              <Link to="/auth">{t("signIn")}</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="shrink-0 sm:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="grid gap-2 border-t px-4 py-3 sm:hidden">
          <Button asChild variant="ghost" className="justify-start"><Link to="/properties" search={{}} onClick={() => setMenuOpen(false)}>{t("browse")}</Link></Button>
          {session && home !== "/properties" && <Button asChild variant="secondary" className="justify-start"><Link to={home} onClick={() => setMenuOpen(false)}>{t("dashboard")}</Link></Button>}
          {session && <><span className="break-all px-4 text-xs text-muted-foreground">{session.user.email}</span><Button variant="ghost" className="justify-start" onClick={() => { setMenuOpen(false); void signOut(); }}>{t("signOut")}</Button></>}
        </nav>
      )}
    </header>
  );
}
