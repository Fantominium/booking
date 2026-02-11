import { describe, expect, it } from "vitest";

const buildRequest = (body: string, signature: string): Request => {
  return new Request("http://localhost/api/webhooks/stripe/test-token", {
    method: "POST",
    headers: {
      "stripe-signature": signature,
      "content-type": "application/json",
    },
    body,
  });
};

describe("webhook security", () => {
  it("rejects invalid webhook signatures", async () => {
    process.env.WEBHOOK_URL_TOKEN = "test-token";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

    const { POST } = await import("@/app/api/webhooks/stripe/[token]/route");

    const request = buildRequest("{}", "t=123,v1=invalid");
    const response = await POST(request, { params: Promise.resolve({ token: "test-token" }) });

    expect(response.status).toBe(400);
  });
});
