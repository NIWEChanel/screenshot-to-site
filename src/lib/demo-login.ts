import { supabase } from "@/integrations/supabase/client";

/** Existing demo accounts sign in normally; no privileged account provisioning. */
export async function signInDemoAccount(credentials: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  if (!data.user) throw new Error("Demo sign-in did not return an account.");
  return data.user;
}