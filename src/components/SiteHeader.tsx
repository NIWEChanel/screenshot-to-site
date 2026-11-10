import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { homeForRoles, useRoles, useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { session } = useSession();
  const roles = useRoles(session?.user.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const home = homeForRoles(roles.data ?? []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-primary">
          REBERO
        </Link>
        <nav className="hidden gap-5 text-sm font-medium sm:flex">
          <Link to="/properties" search={{}} className="hover:text-clay" activeProps={{ className: "text-clay" }}>
            {t("browse")}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="h-8 rounded-md border bg-card px-2 text-xs"
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="rw">RW</option>
          </select>
          {session ? (
            <>
              {home !== "/properties" && (
                <Button asChild size="sm" variant="secondary">
                  <Link to={home}>{t("dashboard")}</Link>
                </Button>
              )}
              <span className="hidden text-xs text-muted-foreground md:inline">{session.user.email}</span>
              <Button size="sm" variant="ghost" onClick={signOut}>
                {t("signOut")}
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="clay">
              <Link to="/auth">{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
