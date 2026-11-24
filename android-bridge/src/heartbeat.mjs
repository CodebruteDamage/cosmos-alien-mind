import { collectRuntime } from "./probe.mjs";

const baseUrl = process.env.COSMOS_BRIDGE_URL;
const token = process.env.COSMOS_BRIDGE_TOKEN;
const deviceId = process.env.COSMOS_BRIDGE_DEVICE_ID;

if (!baseUrl || !token || !deviceId) {
  throw new Error("Set COSMOS_BRIDGE_URL, COSMOS_BRIDGE_TOKEN, and COSMOS_BRIDGE_DEVICE_ID.");
}

const endpoint = new URL("/api/bridge/heartbeat", baseUrl);
if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost") {
  throw new Error("Bridge URL must use HTTPS (localhost is allowed for development).");
}

const report = collectRuntime();
const payload = {
  deviceId,
  platform: report.device.platform,
  architecture: report.device.architecture,
  runtime: report.runtimes,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(10000),
});

const result = await response.json().catch(() => ({}));
if (!response.ok) {
  throw new Error(`Bridge heartbeat failed: HTTP ${response.status} ${result.error || ""}`.trim());
}

process.stdout.write(JSON.stringify(result, null, 2) + "\n");
