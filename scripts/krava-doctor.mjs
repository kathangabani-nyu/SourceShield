/**
 * Loads KRAVA_* vars from .env.local and runs the SDK doctor.
 * Usage: npm run krava:doctor
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");

if (!existsSync(envPath)) {
  console.error("Missing .env.local — copy KRAVA_APP_KEY from your Krava download.");
  process.exit(1);
}

for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (key.startsWith("KRAVA_") && !process.env[key]) {
    process.env[key] = value;
  }
}

if (!process.env.KRAVA_APP_KEY) {
  console.error("KRAVA_APP_KEY not found in .env.local");
  process.exit(1);
}

const result = spawnSync("npx", ["@kravalabs/api-client", "doctor"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
