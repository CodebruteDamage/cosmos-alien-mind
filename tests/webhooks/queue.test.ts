import assert from "node:assert/strict";
import test from "node:test";
import { webhookRetryDelaySeconds } from "../../lib/webhooks/queue";

test("uses bounded exponential retry delays", () => {
  assert.equal(webhookRetryDelaySeconds(1), 30);
  assert.equal(webhookRetryDelaySeconds(2), 60);
  assert.equal(webhookRetryDelaySeconds(3), 120);
  assert.equal(webhookRetryDelaySeconds(20), 3600);
  assert.equal(webhookRetryDelaySeconds(21), 3600);
});

test("rejects invalid retry attempts", () => {
  for (const attempt of [0, -1, 1.5, Number.NaN]) {
    assert.throws(() => webhookRetryDelaySeconds(attempt));
  }
});
