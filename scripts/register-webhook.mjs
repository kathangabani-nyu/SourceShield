/**
 * Register Linq webhook subscription after Vercel deploy.
 * Usage: LINQ_API_KEY=... NEXT_PUBLIC_APP_URL=https://your-app.vercel.app node scripts/register-webhook.mjs
 */

const apiKey = process.env.LINQ_API_KEY;
const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

if (!apiKey) {
  console.error("LINQ_API_KEY required");
  process.exit(1);
}

const targetUrl = `${appUrl}/api/linq/webhook?version=2026-02-03`;

const res = await fetch(
  "https://api.linqapp.com/api/partner/v3/webhook-subscriptions",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_url: targetUrl,
      subscribed_events: ["message.received"],
    }),
  }
);

const data = await res.json();

if (!res.ok) {
  console.error("Failed:", data);
  process.exit(1);
}

console.log("Webhook subscription created:");
console.log("  id:", data.id);
console.log("  target_url:", targetUrl);
console.log("");
console.log("Store signing_secret as LINQ_WEBHOOK_SECRET:");
console.log(" ", data.signing_secret);
