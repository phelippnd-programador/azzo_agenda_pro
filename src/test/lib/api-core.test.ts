import { request } from "@/lib/api/core";

describe("request", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    sessionStorage.clear();
  });

  it("resolves successfully for a 200 response with an empty body", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("", { status: 200, headers: { "Content-Type": "application/json" } })
    ) as unknown as typeof fetch;

    await expect(request("/onboarding/accept-terms", { method: "POST" })).resolves.toEqual({});
  });

  it("resolves successfully for a 204 response", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 })) as unknown as typeof fetch;

    await expect(request("/some/endpoint")).resolves.toEqual({});
  });

  it("still parses a 200 response with a real JSON body", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ) as unknown as typeof fetch;

    await expect(request("/some/endpoint")).resolves.toEqual({ ok: true });
  });
});
