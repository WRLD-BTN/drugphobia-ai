// One-time convenience: copies each workspace's .env.example to .env if a
// real .env doesn't already exist there. Never overwrites a real .env.
import { existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const targets = ["client", "server", "admin", "."];

for (const dir of targets) {
  const example = join(root, dir, ".env.example");
  const real = join(root, dir, ".env");
  if (existsSync(example) && !existsSync(real)) {
    copyFileSync(example, real);
    console.log(`Created ${dir}/.env from ${dir}/.env.example — fill in real values before running.`);
  }
}
