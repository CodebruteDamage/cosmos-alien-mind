import test from "node:test";
import assert from "node:assert/strict";
import { collectRuntime } from "../src/probe.mjs";

test("runtime probe returns the versioned schema and required sections", () => {
  const report = collectRuntime();
  assert.equal(report.schema, "cosmos.termux.runtime.v1");
  assert.ok(report.capturedAt);
  assert.ok(report.device);
  assert.ok(report.runtimes);
  assert.ok(Object.hasOwn(report, "storage"));
  assert.ok(report.repository);
  assert.equal(typeof report.device.architecture, "string");
  assert.equal(typeof report.runtimes.node, "string");
});
