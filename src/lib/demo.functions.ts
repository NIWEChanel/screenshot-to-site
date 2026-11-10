import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Public demo credentials (shown on the sign-in page by design).
const DEMO = {
  admin: { email: "admin@realestate.demo", password: "Admin123!", role: "admin" as const },
  commissioner: { email: "commissioner@realestate.demo", password: "Agent123!", role: "commissioner" as const },
  client: { email: "client@realestate.demo", password: "Client123!", role: "client" as const },
};
type DemoKey = keyof typeof DEMO;

/** Makes sure the requested demo account exists in auth with its role. The browser then signs in normally. */
export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { role: DemoKey }) => {
    if (!d || !(d.role in DEMO)) throw new Error("Invalid demo role");
    return d;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const acc = DEMO[data.role];
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    let user = list?.users.find((u) => u.email === acc.email);
    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { demo: true },
      });
      if (error) throw new Error(error.message);
      user = created.user!;
    }
    await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: acc.role }, { onConflict: "user_id,role" });
    if (data.role === "commissioner") {
      await supabaseAdmin
        .from("commissioners")
        .update({ user_id: user.id })
        .eq("email", acc.email)
        .eq("is_demo", true);
    }
    return { ok: true };
  });

/** Restores the original demo dataset. Only the demo super admin may run it; real data is never touched. */
export const resetDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const email = (context.claims as { email?: string }).email;
    if (!isAdmin || email !== DEMO.admin.email) throw new Error("Only the demo super admin can reset demo data");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("reset_demo_data");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
