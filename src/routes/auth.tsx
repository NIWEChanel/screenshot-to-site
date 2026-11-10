import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Briefcase, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureDemoAccount } from "@/lib/demo.functions";
import { homeForRoles } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — REBERO" },
      { name: "description", content: "Sign in to REBERO or try the demo as super admin, commissioner or client." },
      { property: "og:title", content: "Sign in — REBERO" },
      { property: "og:description", content: "Access your REBERO account or explore the demo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const DEMOS = [
  { role: "admin" as const, label: "Super Admin demo", email: "admin@realestate.demo", password: "Admin123!", icon: ShieldCheck },
  { role: "commissioner" as const, label: "Commissioner demo", email: "commissioner@realestate.demo", password: "Agent123!", icon: Briefcase },
  { role: "client" as const, label: "Client demo", email: "client@realestate.demo", password: "Client123!", icon: User },
];

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", type: "client" });

  async function goHome(userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    navigate({ to: homeForRoles((data ?? []).map((r) => r.role)), replace: true });
  }

  async function demoLogin(d: (typeof DEMOS)[number]) {
    setBusy(d.role);
    try {
      await ensureDemoAccount({ data: { role: d.role } });
      const { data, error } = await supabase.auth.signInWithPassword({ email: d.email, password: d.password });
      if (error) throw error;
      await goHome(data.user.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("form");
    try {
      if (mode === "in") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        await goHome(data.user.id);
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: form.name, phone: form.phone, account_type: form.type },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-2">
      <section>
        <span className="rounded-full bg-warning/30 px-3 py-1 text-xs font-bold uppercase tracking-wide">Demo environment</span>
        <h1 className="mt-4 text-4xl font-bold">Try REBERO instantly</h1>
        <p className="mt-2 text-muted-foreground">Real sign-in with demo accounts. No real money is ever charged.</p>
        <div className="mt-6 space-y-3">
          {DEMOS.map((d) => (
            <button
              key={d.role}
              onClick={() => demoLogin(d)}
              disabled={!!busy}
              className="flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition hover:border-clay hover:shadow-warm disabled:opacity-60"
            >
              <d.icon className="h-8 w-8 text-clay" />
              <span className="flex-1">
                <span className="block font-semibold">{busy === d.role ? "Signing in…" : d.label}</span>
                <span className="block text-xs text-muted-foreground">{d.email} · {d.password}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-6">
        <div className="mb-5 flex gap-2">
          <Button variant={mode === "in" ? "default" : "ghost"} size="sm" onClick={() => setMode("in")}>Sign in</Button>
          <Button variant={mode === "up" ? "default" : "ghost"} size="sm" onClick={() => setMode("up")}>Create account</Button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <>
              <div><Label>Full name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+2507…" /></div>
              <div>
                <Label>I am a</Label>
                <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="client">Client (browse & contact)</option>
                  <option value="commissioner">Commissioner (list properties — needs approval)</option>
                </select>
              </div>
            </>
          )}
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <Button type="submit" variant="clay" className="w-full" disabled={!!busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
      </section>
    </main>
  );
}
