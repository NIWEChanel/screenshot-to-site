import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DemoBadge, Stat, StatusPill } from "@/components/DemoBadge";
import { PropertyForm } from "@/components/PropertyForm";
import { fmtDate, imageUrl, rwf } from "@/lib/format";
import { lookupsQuery, PROPERTY_SELECT, type PropertyRow } from "@/lib/queries";
import { useRoles } from "@/lib/auth";
import { resetDemoData } from "@/lib/demo.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Super admin — REBERO" }, { name: "description", content: "REBERO platform administration." }] }),
  component: Admin,
});

function Admin() {
  const { user } = Route.useRouteContext();
  const roles = useRoles(user.id);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries();
  const coms = useQuery({ queryKey: ["a-coms"], queryFn: async () => (await supabase.from("commissioners").select("*, plans(name)").order("created_at")).data ?? [] });
  const props = useQuery({ queryKey: ["a-props"], queryFn: async () => ((await supabase.from("properties").select(PROPERTY_SELECT).order("created_at", { ascending: false })).data ?? []) as unknown as PropertyRow[] });
  const pays = useQuery({ queryKey: ["a-pays"], queryFn: async () => (await supabase.from("payments").select("*, plans(name), commissioners(name)").order("created_at", { ascending: false })).data ?? [] });
  const lookups = useQuery(lookupsQuery);
  const settings = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("settings").select("*").order("key")).data ?? [] });
  const [editing, setEditing] = useState<PropertyRow | null>(null);

  if (roles.isLoading) return <main className="p-10 text-center text-muted-foreground">Loading…</main>;
  if (!roles.data?.includes("admin")) return <main className="p-10 text-center">Admins only.</main>;

  const P = props.data ?? [];
  const approvedPays = (pays.data ?? []).filter((p) => p.status === "approved");
  const isDemoAdmin = user.email === "admin@realestate.demo";

  const run = async (fn: PromiseLike<{ error: { message: string } | null }>, msg: string) => {
    const { error } = await fn;
    if (error) toast.error(error.message); else { toast.success(msg); refresh(); }
  };

  async function doReset() {
    try {
      await resetDemoData();
      toast.success("Demo data restored");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const byGroup = (key: "categories" | "locations") => {
    const m = new Map<string, number>();
    P.forEach((p) => { const k = p[key]?.name ?? "—"; m.set(k, (m.get(k) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="flex-1 text-3xl font-bold">Super admin</h1>
        <DemoBadge />
        {isDemoAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" size="sm">Demo reset</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore the original demo data?</AlertDialogTitle>
                <AlertDialogDescription>All demo properties, commissioners, plans, payments and statuses go back to their starting state. Real accounts and non-demo data are not touched.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={doReset}>Reset demo</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6 flex-wrap">
          {["overview", "commissioners", "payments", "properties", "plans", "catalog", "settings"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "catalog" ? "Categories & locations" : t}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Properties" value={P.length} />
            <Stat label="Pending listings" value={P.filter((p) => p.status === "pending").length} />
            <Stat label="Total listed value" value={rwf(P.filter((p) => p.status === "approved" && p.listing_type === "sale").reduce((s, p) => s + p.price, 0))} />
            <Stat label="Subscription revenue (demo)" value={rwf(approvedPays.reduce((s, p) => s + p.amount, 0))} />
            <Stat label="Commissioners" value={coms.data?.length ?? 0} />
            <Stat label="Pending commissioners" value={coms.data?.filter((c) => c.status === "pending").length ?? 0} />
            <Stat label="Pending payments" value={pays.data?.filter((p) => p.status === "pending").length ?? 0} />
            <Stat label="Total views" value={P.reduce((s, p) => s + p.views, 0)} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {(["categories", "locations"] as const).map((k) => (
              <div key={k} className="rounded-2xl border bg-card p-5">
                <h2 className="mb-3 text-xl font-bold capitalize">Listings by {k === "categories" ? "category" : "location"}</h2>
                {byGroup(k).map(([name, n]) => (
                  <div key={name} className="mb-2 text-sm">
                    <div className="flex justify-between"><span>{name}</span><span>{n}</span></div>
                    <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(n / Math.max(1, P.length)) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="commissioners">
          <div className="space-y-3">
            {coms.data?.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3">
                <img src={c.avatar_url ?? ""} alt="" className="h-12 w-12 rounded-full bg-muted object-cover" />
                <div className="min-w-48 flex-1">
                  <p className="font-semibold">{c.name} {c.is_demo && <span className="text-xs text-warning">DEMO</span>}</p>
                  <p className="text-sm text-muted-foreground">{c.email} · {c.plans?.name ?? "No plan"} · until {fmtDate(c.sub_end)} · <StatusPill s={c.status} /></p>
                </div>
                <div className="flex gap-2">
                  {c.status === "pending" && <>
                    <Button size="sm" onClick={() => run(supabase.from("commissioners").update({ status: "active" }).eq("id", c.id), "Approved")}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => run(supabase.from("commissioners").update({ status: "rejected" }).eq("id", c.id), "Rejected")}>Reject</Button>
                  </>}
                  {c.status === "active" && <Button size="sm" variant="outline" onClick={() => run(supabase.from("commissioners").update({ status: "suspended" }).eq("id", c.id), "Suspended")}>Suspend</Button>}
                  {(c.status === "suspended" || c.status === "rejected") && <Button size="sm" onClick={() => run(supabase.from("commissioners").update({ status: "active" }).eq("id", c.id), "Reactivated")}>Reactivate</Button>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <table className="w-full rounded-2xl border bg-card text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="p-3">Date</th><th>Commissioner</th><th>Plan</th><th>Amount</th><th>Method / ref</th><th>Status</th><th /></tr></thead>
            <tbody>
              {pays.data?.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{fmtDate(p.created_at)}</td><td>{p.commissioners?.name}</td><td>{p.plans?.name}</td><td>{rwf(p.amount)}</td>
                  <td>{p.method} · {p.reference} {p.is_demo && <span className="text-xs font-bold text-warning">DEMO PAYMENT</span>}</td>
                  <td><StatusPill s={p.status} /></td>
                  <td className="space-x-1 pr-3 text-right">
                    {p.status === "pending" && <>
                      <Button size="sm" onClick={() => run(supabase.rpc("review_payment", { _id: p.id, _approve: true }), "Payment approved, subscription active")}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => { const r = prompt("Reason for rejection?") ?? ""; run(supabase.rpc("review_payment", { _id: p.id, _approve: false, _note: r }), "Payment rejected"); }}>Reject</Button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="properties">
          {editing ? (
            <div className="rounded-2xl border bg-card p-5">
              <PropertyForm initial={editing} commissionerId={editing.commissioner_id} onDone={() => { setEditing(null); refresh(); }} />
            </div>
          ) : (
            <div className="space-y-3">
              {P.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3">
                  <img src={imageUrl(p.images[0])} alt="" className="h-16 w-24 rounded-md object-cover" />
                  <div className="min-w-48 flex-1">
                    <p className="font-semibold">{p.title} {p.featured && <span className="text-xs text-clay">★ Featured</span>}</p>
                    <p className="text-sm text-muted-foreground">{rwf(p.price)} · {p.commissioners?.name ?? "—"} · {p.locations?.name} · <StatusPill s={p.status} /></p>
                    {p.rejection_reason && <p className="text-xs text-destructive">{p.rejection_reason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.status !== "approved" && <Button size="sm" onClick={() => run(supabase.from("properties").update({ status: "approved", rejection_reason: null }).eq("id", p.id), "Approved")}>Approve</Button>}
                    {p.status === "pending" && <Button size="sm" variant="outline" onClick={() => { const r = prompt("Rejection reason?"); if (r) run(supabase.from("properties").update({ status: "rejected", rejection_reason: r }).eq("id", p.id), "Rejected"); }}>Reject</Button>}
                    <Button size="sm" variant="secondary" onClick={() => run(supabase.from("properties").update({ featured: !p.featured }).eq("id", p.id), p.featured ? "Unfeatured" : "Featured")}>{p.featured ? "Unfeature" : "Feature"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => confirm("Delete property?") && run(supabase.from("properties").delete().eq("id", p.id), "Deleted")}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans"><Plans plans={lookups.data?.plans ?? []} run={run} /></TabsContent>

        <TabsContent value="catalog" className="grid gap-6 md:grid-cols-2">
          <NameList title="Categories" items={lookups.data?.categories ?? []} onAdd={(name) => run(supabase.from("categories").insert({ name }), "Added")} onDel={(id) => run(supabase.from("categories").delete().eq("id", id), "Removed")} onRename={(id, name) => run(supabase.from("categories").update({ name }).eq("id", id), "Saved")} />
          <NameList title="Locations" items={lookups.data?.locations ?? []} onAdd={(name) => run(supabase.from("locations").insert({ name }), "Added")} onDel={(id) => run(supabase.from("locations").delete().eq("id", id), "Removed")} onRename={(id, name) => run(supabase.from("locations").update({ name }).eq("id", id), "Saved")} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="max-w-xl space-y-3 rounded-2xl border bg-card p-5">
            {settings.data?.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-36 text-sm font-medium">{s.key}</span>
                <Input defaultValue={s.value} onBlur={(e) => e.target.value !== s.value && run(supabase.from("settings").update({ value: e.target.value }).eq("key", s.key), "Setting saved")} />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

type Run = (fn: PromiseLike<{ error: { message: string } | null }>, msg: string) => void;
type Plan = { id: string; name: string; price: number; duration_days: number; max_listings: number; description: string };

function Plans({ plans, run }: { plans: Plan[]; run: Run }) {
  const blank = { name: "", price: 0, duration_days: 30, max_listings: 10, description: "" };
  const [n, setN] = useState(blank);
  return (
    <div className="space-y-3">
      {plans.map((p) => (
        <form key={p.id} className="grid items-center gap-2 rounded-xl border bg-card p-3 sm:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run(supabase.from("plans").update({ name: String(fd.get("name")), price: Number(fd.get("price")), duration_days: Number(fd.get("d")), max_listings: Number(fd.get("m")), description: String(fd.get("desc")) }).eq("id", p.id), "Plan saved");
          }}>
          <Input name="name" defaultValue={p.name} /><Input name="price" type="number" defaultValue={p.price} /><Input name="d" type="number" defaultValue={p.duration_days} title="Days" /><Input name="m" type="number" defaultValue={p.max_listings} title="Max listings" /><Input name="desc" defaultValue={p.description} />
          <div className="flex gap-1"><Button size="sm" type="submit">Save</Button><Button size="sm" type="button" variant="ghost" onClick={() => confirm("Delete plan?") && run(supabase.from("plans").delete().eq("id", p.id), "Deleted")}>Delete</Button></div>
        </form>
      ))}
      <div className="grid items-center gap-2 rounded-xl border-2 border-dashed p-3 sm:grid-cols-6">
        <Input placeholder="Name" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} />
        <Input type="number" placeholder="Price" value={n.price} onChange={(e) => setN({ ...n, price: Number(e.target.value) })} />
        <Input type="number" placeholder="Days" value={n.duration_days} onChange={(e) => setN({ ...n, duration_days: Number(e.target.value) })} />
        <Input type="number" placeholder="Listings" value={n.max_listings} onChange={(e) => setN({ ...n, max_listings: Number(e.target.value) })} />
        <Input placeholder="Description" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} />
        <Button size="sm" variant="clay" onClick={() => { if (n.name) { run(supabase.from("plans").insert(n), "Plan created"); setN(blank); } }}>Create plan</Button>
      </div>
    </div>
  );
}

function NameList({ title, items, onAdd, onDel, onRename }: { title: string; items: { id: string; name: string }[]; onAdd: (n: string) => void; onDel: (id: string) => void; onRename: (id: string, n: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex gap-2">
            <Input defaultValue={i.name} onBlur={(e) => e.target.value !== i.name && onRename(i.id, e.target.value)} />
            <Button size="sm" variant="ghost" onClick={() => confirm("Remove?") && onDel(i.id)}>Remove</Button>
          </div>
        ))}
        <div className="flex gap-2 pt-2"><Input placeholder={`New ${title.toLowerCase().slice(0, -1)}`} value={v} onChange={(e) => setV(e.target.value)} /><Button size="sm" onClick={() => { if (v) { onAdd(v); setV(""); } }}>Add</Button></div>
      </div>
    </div>
  );
}
