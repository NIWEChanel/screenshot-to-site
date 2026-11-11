import { describe, expect, it } from "vitest";

describe("public access", () => {
  it("denies anonymous access to administrator settings", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Backend test configuration missing");
    const response = await fetch(`${url}/rest/v1/settings?select=*`, { headers: { apikey: key } });
    expect(response.status).toBe(401);
  });
});