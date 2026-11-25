import test from "node:test";
import assert from "node:assert/strict";

test("runtime client source contains no shell execution primitives", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/assistant.mjs", import.meta.url), "utf8");
  assert.match(source, /\/api\/runtime\/respond/);
  assert.match(source, /authorization:/);
  assert.match(source, /AbortSignal\.timeout/);
  assert.doesNotMatch(source, /execSync|execFileSync|spawn\(|child_process/);
});
