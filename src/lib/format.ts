import villa from "@/assets/prop-villa.jpg";
import apartment from "@/assets/prop-apartment.jpg";
import lake from "@/assets/prop-lake.jpg";
import land from "@/assets/prop-land.jpg";

const builtIn: Record<string, string> = { villa, apartment, lake, land };

export function imageUrl(key?: string | null) {
  if (!key) return villa;
  return builtIn[key] ?? key;
}

export function rwf(n: number) {
  return new Intl.NumberFormat("en-RW").format(n) + " RWF";
}

export function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
