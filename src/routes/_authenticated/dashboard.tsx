import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoBadge, Stat, StatusPill } from "@/components/DemoBadge";
import { PropertyForm } from "@/components/PropertyForm";
import { fmtDate, imageUrl, rwf } from "@/lib/format";
import { lookupsQuery, PROPERTY_SELECT, type PropertyRow } from "@/lib/queries";
import { uploadImage } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Commissioner dashboard — REBERO" }, { name: "description", content: "Manage your REBERO listings and subscription." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ["me-commissioner", user.id],
    queryFn: async () => (await supabase.from("commissioners").select("*, plans(name)").eq("user_id", user.id).maybeSingle()).data,
  });
  const cid = me.data?.id;
  const props = useQuery({
    queryKey: ["my-props", cid],
    enabled: !!cid,
    queryFn: async () => ((await supabase.from("properties").select(PROPERTY_SELECT).eq("commissioner_id", cid!).order("created_at", { ascending: false })).data ?? []) as unknown as PropertyRow[],
  });
  const pays = useQuery({
    queryKey: ["my-pays", cid],
    enabled: !!cid,
    queryFn: async () => (await supabase.from("payments").select("*, plans(name)").eq("commissioner_id", cid!).order("created_at", { ascending: false })).data ?? [],
  });
  const notes = useQuery({
    queryKey: ["my-notes", cid],
    enabled: !!cid,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("commissioner_id", cid!).order("created_at", { ascending: false }).limit(20)).data ?? [],
  });
  const refresh = () => qc.invalidateQueries();
  const [editing, setEditing] = useState<PropertyRow | "new" | null>(null);

  if (me.isLoading) return <main className="p-10 text-center text-muted-foreground">Loading…</main>;
  if (!me.data) return <main className="p-10 text-center">This account has no commissioner profile. <Link to="/properties" search={{}} className="text-clay underline">Browse properties</Link></main>;
  const c = me.data;
  const subActive = c.status === "active" && c.sub_end && new Date(c.sub_end) > new Date();
  const list = props.data ?? [];

  async function setStatus(p: PropertyRow, status: "sold" | "rented") {
    const { error } = await supabase.from("properties").update({ status }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success(`Marked ${status}`); refresh(); }
  }
  async function remove(p: PropertyRow) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await supabase.from("properties").delete().eq("id", p.id);
    refresh();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <img src={c.avatar_url ?? ""} alt="" className="h-14 w-14 rounded-full bg-muted object-cover" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">Account <StatusPill s={c.status} /> · Plan: {c.plans?.name ?? "none"} · Expires {fmtDate(c.sub_end)}</p>
        </div>
        <DemoBadge />
      </div>
      {!subActive && (
        <div className="mb-6 rounded-xl border border-warning bg-warning/15 p-4 text-sm">
          {c.status === "pending" ? "Your commissioner account is awaiting admin approval. " : c.status === "suspended" ? "Your account is suspended. " : ""}
          Publishing is locked until you have an approved, active subscription.
        </div>
      )}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Active listings" value={list.filter((p) => p.status === "approved").length} />
            <Stat label="Pending" value={list.filter((p) => p.status === "pending").length} />
            <Stat label="Sold / rented" value={list.filter((p) => p.status === "sold" || p.status === "rented").length} />
            <Stat label="Total views" value={list.reduce((s, p) => s + p.views, 0)} />
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 text-xl font-bold">Performance</h2>
            {[...list].sort((a, b) => b.views - a.views).map((p) => {
              const max = Math.max(1, ...list.map((x) => x.views));
              return (
                <div key={p.id} className="mb-2 text-sm">
                  <div className="flex justify-between"><span>{p.title}</span><span>{p.views} views</span></div>
                  <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-clay" style={{ width: `${(p.views / max) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 text-xl font-bold">Notifications & activity</h2>
            <ul className="space-y-2 text-sm">
              {notes.data?.map((n) => <li key={n.id} className="flex justify-between gap-4 border-b pb-2"><span>{n.message}</span><span className="shrink-0 text-muted-foreground">{fmtDate(n.created_at)}</span></li>)}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="listings">
          {editing ? (
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="mb-4 text-xl font-bold">{editing === "new" ? "New property" : "Edit property"}</h2>
              <PropertyForm commissionerId={c.id} initial={editing === "new" ? undefined : editing} onDone={() => { setEditing(null); refresh(); }} />
            </div>
          ) : (
            <>
              <Button variant="clay" className="mb-4" disabled={!subActive} onClick={() => setEditing("new")}>+ Add property</Button>
              <div className="space-y-3">
                {list.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3">
                    <img src={imageUrl(p.images[0])} alt="" className="h-16 w-24 rounded-md object-cover" />
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{rwf(p.price)} · {p.views} views · <StatusPill s={p.status} /></p>
                      {p.status === "rejected" && p.rejection_reason && <p className="mt-1 text-sm text-destructive">Reason: {p.rejection_reason}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.status === "approved" && <Button size="sm" variant="secondary" onClick={() => setStatus(p, p.listing_type === "rent" ? "rented" : "sold")}>Mark {p.listing_type === "rent" ? "rented" : "sold"}</Button>}
                      <Button size="sm" variant="outline" disabled={!subActive} onClick={() => setEditing(p)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="subscription">
          <Subscription cid={c.id} pays={pays.data ?? []} onDone={refresh} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileForm c={c} onDone={refresh} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

type Pay = { id: string; amount: number; method: string; reference: string; status: string; note: string | null; created_at: string; plans: { name: string } | null };

function Subscription({ cid, pays, onDone }: { cid: string; pays: Pay[]; onDone: () => void }) {
  const lookups = useQuery(lookupsQuery);
  const [plan, setPlan] = useState<string | null>(null);
  const [method, setMethod] = useState("MTN MoMo (demo)");
  const [ref, setRef] = useState("");
  const chosen = lookups.data?.plans.find((p) => p.id === plan);

  async function submit() {
    if (!plan) return;
    const { error } = await supabase.from("payments").insert({ commissioner_id: cid, plan_id: plan, method, reference: ref || `DEMO-${Date.now()}` });
    if (error) { toast.error(error.message); return; }
    toast.success("Demo payment submitted — pending admin approval");
    setPlan(null); setRef(""); onDone();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {lookups.data?.plans.map((p) => (
          <button key={p.id} onClick={() => setPlan(p.id)} className={`rounded-2xl border bg-card p-5 text-left transition ${plan === p.id ? "border-clay shadow-warm" : "hover:border-clay"}`}>
            <p className="font-display text-xl font-bold">{p.name}</p>
            <p className="mt-1 text-2xl font-bold text-clay">{rwf(p.price)}</p>
            <p className="text-sm text-muted-foreground">{p.duration_days} days · {p.max_listings} listings</p>
            <p className="mt-2 text-sm">{p.description}</p>
          </button>
        ))}
      </div>
      {chosen && (
        <div className="rounded-2xl border-2 border-dashed border-warning bg-card p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide">Demo payment — no real money is charged</p>
          <p className="text-sm">Simulated instructions: send <b>{rwf(chosen.price)}</b> to MoMo code <b>*182*8*1*000000#</b> (demo) and enter any reference below.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <select className="h-9 rounded-md border bg-card px-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>MTN MoMo (demo)</option><option>Airtel Money (demo)</option><option>Bank transfer (demo)</option>
            </select>
            <Input placeholder="Transaction reference" value={ref} onChange={(e) => setRef(e.target.value)} />
            <Button variant="clay" onClick={submit}>Submit demo payment</Button>
          </div>
        </div>
      )}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 text-xl font-bold">Payment history</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>
            {pays.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-2">{fmtDate(p.created_at)}</td><td>{p.plans?.name}</td><td>{rwf(p.amount)}</td><td>{p.method} <span className="text-xs font-bold text-warning">DEMO</span></td>
                <td><StatusPill s={p.status} />{p.note && <span className="ml-2 text-xs text-muted-foreground">{p.note}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type C = { id: string; name: string; phone: string; whatsapp: string; bio: string; avatar_url: string | null };
function ProfileForm({ c, onDone }: { c: C; onDone: () => void }) {
  const [f, setF] = useState({ name: c.name, phone: c.phone, whatsapp: c.whatsapp, bio: c.bio, avatar_url: c.avatar_url });
  async function save() {
    const { error } = await supabase.from("commissioners").update(f).eq("id", c.id);
    if (error) toast.error(error.message); else { toast.success("Profile saved"); onDone(); }
  }
  return (
    <div className="max-w-xl space-y-3 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-4">
        <img src={f.avatar_url ?? ""} alt="" className="h-20 w-20 rounded-full bg-muted object-cover" />
        <Input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { setF({ ...f, avatar_url: await uploadImage(file) }); } catch (err) { toast.error((err as Error).message); } } }} />
      </div>
      <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <div><Label>WhatsApp number (digits only)</Label><Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
      <div><Label>Bio</Label><Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
      <Button variant="clay" onClick={save}>Save profile</Button>
    </div>
  );
}
