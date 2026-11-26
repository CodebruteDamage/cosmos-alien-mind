import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalyticsQuery } from "../lib/analytics-contract.ts";

test("bounds analytics windows and limits", () => {
  assert.deepEqual(buildAnalyticsQuery({ windowMinutes: 60, limit: 200 }), { windowMinutes: 60, limit: 200 });
  assert.throws(() => buildAnalyticsQuery({ windowMinutes: 4, limit: 200 }), { code: "INVALID_ANALYTICS_QUERY" });
  assert.throws(() => buildAnalyticsQuery({ windowMinutes: 1441, limit: 200 }), { code: "INVALID_ANALYTICS_QUERY" });
  assert.throws(() => buildAnalyticsQuery({ windowMinutes: 60, limit: 501 }), { code: "INVALID_ANALYTICS_QUERY" });
  assert.throws(() => buildAnalyticsQuery({ windowMinutes: 60, limit: 0 }), { code: "INVALID_ANALYTICS_QUERY" });
});
