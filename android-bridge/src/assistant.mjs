const baseUrl = process.env.COSMOS_BRIDGE_URL;
const token = process.env.COSMOS_BRIDGE_TOKEN;
const prompt = process.argv.slice(2).join(" ").trim();

if (!baseUrl || !token || !prompt) {
  process.stderr.write("Usage: COSMOS_BRIDGE_URL=https://host COSMOS_BRIDGE_TOKEN=... node android-bridge/src/assistant.mjs \"your prompt\"\n");
  process.exitCode = 2;
} else {
  const endpoint = new URL("/api/runtime/respond", baseUrl);
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost") {
    throw new Error("Bridge URL must use HTTPS (localhost is allowed for development).");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ prompt }),
    signal: AbortSignal.timeout(35000)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`COSMOS runtime request failed: HTTP ${response.status} ${result.error || ""}`.trim());
  }
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
