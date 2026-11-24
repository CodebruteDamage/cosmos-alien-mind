import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function safeGitStatus(cwd) {
  if (!fs.existsSync(path.join(cwd, ".git"))) return { available: false, reason: "not-a-git-repository" };
  try {
    return {
      available: true,
      output: execFileSync("git", ["status", "--short", "--branch"], {
        cwd, encoding: "utf8", timeout: 3000, stdio: ["ignore", "pipe", "pipe"]
      }).trim()
    };
  } catch {
    return { available: false, reason: "git-status-failed" };
  }
}

function storageFor(home) {
  try {
    const s = fs.statfsSync(home);
    const total = Number(s.blocks) * Number(s.bsize);
    const available = Number(s.bavail) * Number(s.bsize);
    return { totalBytes: total, availableBytes: available };
  } catch {
    return null;
  }
}

export function collectRuntime({ cwd = process.cwd() } = {}) {
  const home = process.env.HOME || os.homedir();
  const prefix = process.env.PREFIX || null;
  const isTermux = Boolean(prefix && prefix.includes("com.termux"));
  return {
    schema: "cosmos.termux.runtime.v1",
    capturedAt: new Date().toISOString(),
    device: {
      platform: os.platform(),
      release: os.release(),
      architecture: os.arch(),
      hostname: os.hostname(),
      isTermux,
      prefix
    },
    runtimes: {
      node: process.version,
      npm: process.env.npm_config_user_agent?.split(" ")[0] || null,
      python: process.env.PYTHON_VERSION || null,
      git: safeGitStatus(cwd).available
    },
    storage: storageFor(home),
    repository: safeGitStatus(cwd)
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(JSON.stringify(collectRuntime(), null, 2) + "\n");
}
