import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { imageUrl } from "@/lib/format";
import { lookupsQuery, type PropertyRow } from "@/lib/queries";
import { uploadImage } from "@/lib/upload";

type Props = { initial?: PropertyRow | undefined; commissionerId: string; onDone: () => void };

export function PropertyForm({ initial, commissionerId, onDone }: Props) {
  const lookups = useQuery(lookupsQuery);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    listing_type: initial?.listing_type ?? "sale",
    category_id: initial?.category_id ?? "",
    location_id: initial?.location_id ?? "",
    bedrooms: initial?.bedrooms ?? 0,
    bathrooms: initial?.bathrooms ?? 0,
    area_sqm: initial?.area_sqm ?? 0,
    images: initial?.images ?? [],
  });
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      setF((p) => ({ ...p, images: [...p.images, ...urls] }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.images.length === 0) { toast.error("Add at least one image"); return; }
    setBusy(true);
    const row = {
      ...f,
      price: Number(f.price),
      bedrooms: Number(f.bedrooms),
      bathrooms: Number(f.bathrooms),
      area_sqm: Number(f.area_sqm),
      category_id: f.category_id || null,
      location_id: f.location_id || null,
    };
    const { error } = initial
      ? await supabase.from("properties").update(row).eq("id", initial.id)
      : await supabase.from("properties").insert({ ...row, commissioner_id: commissionerId });
    setBusy(false);
    if (error) { toast.error(error.message.includes("row-level") ? "You need an active subscription to publish." : error.message); return; }
    toast.success(initial ? "Saved" : "Submitted for approval");
    onDone();
  }

  const sel = "h-9 w-full rounded-md border bg-card px-2 text-sm";
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label>Title</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div><Label>Price (RWF)</Label><Input type="number" required value={f.price} onChange={num("price")} /></div>
      <div><Label>Type</Label><select className={sel} value={f.listing_type} onChange={(e) => setF({ ...f, listing_type: e.target.value })}><option value="sale">For sale</option><option value="rent">For rent</option></select></div>
      <div><Label>Category</Label><select className={sel} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}><option value="">—</option>{lookups.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><Label>Location</Label><select className={sel} value={f.location_id} onChange={(e) => setF({ ...f, location_id: e.target.value })}><option value="">—</option>{lookups.data?.locations.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><Label>Bedrooms</Label><Input type="number" value={f.bedrooms} onChange={num("bedrooms")} /></div>
      <div><Label>Bathrooms</Label><Input type="number" value={f.bathrooms} onChange={num("bathrooms")} /></div>
      <div><Label>Area (m²)</Label><Input type="number" value={f.area_sqm} onChange={num("area_sqm")} /></div>
      <div><Label>Images</Label><Input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} /></div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        {f.images.map((img, i) => (
          <div key={i} className="relative h-16 w-24 overflow-hidden rounded-md">
            <img src={imageUrl(img)} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })} className="absolute right-0.5 top-0.5 rounded-full bg-card p-0.5"><X className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="clay" disabled={busy}>{busy ? "Working…" : initial ? "Save (re-submits for approval)" : "Submit for approval"}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
