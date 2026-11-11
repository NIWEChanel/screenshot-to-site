import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithPassword } },
}));
import { signInDemoAccount } from "@/lib/demo-login";

describe("demo sign-in without private hosting keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  });
  it("signs in through normal account authentication without server credentials", async () => {
    const credentials = { email: "client@realestate.demo", password: "Client123!" };
    signInWithPassword.mockResolvedValue({ data: { user: { id: "demo-client" } }, error: null });
    expect(await signInDemoAccount(credentials)).toEqual({ id: "demo-client" });
    expect(signInWithPassword).toHaveBeenCalledExactlyOnceWith(credentials);
  });
  it("does not bypass authentication when the password is rejected", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: new Error("Invalid credentials") });
    await expect(signInDemoAccount({ email: "client@realestate.demo", password: "incorrect" })).rejects.toThrow("Invalid credentials");
  });
});