import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Restores the original demo dataset. Only the demo super admin may run it; real data is never touched. */
export const resetDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const email = (context.claims as { email?: string }).email;
    if (!isAdmin || email !== "admin@realestate.demo") throw new Error("Only the demo super admin can reset demo data");
    if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY']) {
      throw new Error("Demo reset is only available on the connected Lovable Cloud deployment. Browsing and sign-in do not require this action.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("reset_demo_data");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
