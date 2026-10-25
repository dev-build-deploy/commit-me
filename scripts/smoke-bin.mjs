// SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
// SPDX-License-Identifier: CC0-1.0

// Runs the committed bundles the way users do: `bin/commit-me --help`, and `bin/pre-commit-me` (the pre-commit
// hook and the Claude plugin's entry) on a compliant and a non-compliant message read from stdin. Catches a bundle
// or bin wrapper that no longer loads (e.g. CommonJS `require` of an ESM bundle). Usage: node scripts/smoke-bin.mjs

import { spawnSync } from "node:child_process";

const cases = [
  { args: ["bin/commit-me", "--help"], input: "", exit: 0 },
  { args: ["bin/pre-commit-me", "/dev/stdin"], input: "feat: a compliant message\n", exit: 0 },
  { args: ["bin/pre-commit-me", "/dev/stdin"], input: "not compliant\n", exit: 1, output: /compliance issues/ },
];

let failed = false;
for (const c of cases) {
  const run = spawnSync(process.execPath, c.args, { input: c.input, encoding: "utf8" });
  const out = `${run.stdout}${run.stderr}`;
  const ok = run.status === c.exit && (!c.output || c.output.test(out));
  console.log(`${ok ? "ok  " : "FAIL"} node ${c.args.join(" ")} (exit ${run.status}, expected ${c.exit})`);
  if (!ok) {
    failed = true;
    console.error(out.trim());
  }
}
process.exit(failed ? 1 : 0);
