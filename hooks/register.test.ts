/*
 * SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { expect, test } from "claude-code/testing";

const CONFIG = JSON.stringify({ types: ["chore", "docs"], scopes: ["cli", "deps"] });

/** The engine below the plugin: a repo with a config, optionally mid-merge, and a stand-in for the validator. */
function engine(on: any, opts: { merge?: boolean } = {}) {
  const ran: string[][] = [];
  let written = "";
  on("fs.write", (_: any, e: any) => {
    written = e.text;
    return { value: undefined };
  });
  on("fs.exists", (_: any, e: any) => ({ value: !e.path.endsWith("MERGE_HEAD") }));
  on("fs.read", (_: any, e: any) => ({ value: e.path.endsWith("/.commit-me.json") ? CONFIG : "chore: from a file" }));
  on("process.run", (_: any, e: any) => {
    if (e.argv[0] === "git") return { value: { exitCode: opts.merge ? 0 : 1, stdout: "", stderr: "" } };
    if (e.argv[0] === "mktemp") return { value: { exitCode: 0, stdout: "/tmp/msg-1\n", stderr: "" } };
    if (e.argv[0] === "rm") return { value: { exitCode: 0, stdout: "", stderr: "" } };
    ran.push(e.argv);
    const msg = written;
    const ok = /^(feat|fix|chore|docs)(\((cli|deps)\))?!?: /.test(msg);
    return {
      value: {
        exitCode: ok ? 0 : 1,
        stdout: ok ? "" : "error: invalid type or scope\n",
        stderr: ok ? "" : "Found 1 Conventional Commit compliance issues, and 0 warnings.",
      },
    };
  });
  on("tool.call", () => ({ result: {} }));
  return ran;
}

const commit = ($: any, command: string) => $.tool.call({ tool: "Bash", command });

test("a compliant message passes", async ($, on) => {
  const ran = engine(on);
  const r = await commit($, 'git commit -m "feat(cli): add a flag"');
  expect(r.deny).toBeUndefined();
  expect(ran.length).toBe(1);
  expect(ran[0]).toContain(".commit-me.json");
});

test("a bad type is denied with the allowed types and scopes", async ($, on) => {
  engine(on);
  const r = await commit($, 'git commit -m "feature: add a flag"');
  expect(r.deny).toBeDefined();
  expect(r.deny).toContain("compliance issues");
  expect(r.deny).toContain("Allowed types: feat, fix, chore, docs");
  expect(r.deny).toContain("Allowed scopes: cli, deps");
});

test("a bad scope is denied", async ($, on) => {
  engine(on);
  const r = await commit($, "git add -A && git commit -m 'fix(nope): x'");
  expect(r.deny).toBeDefined();
});

test("a merge subject passes", async ($, on) => {
  const ran = engine(on);
  expect((await commit($, "git commit -m \"Merge branch 'x' into main\"")).deny).toBeUndefined();
  expect(ran.length).toBe(0);
});

test("a merge in progress (MERGE_HEAD) passes", async ($, on) => {
  const ran = engine(on, { merge: true });
  expect((await commit($, 'git commit -m "whatever"')).deny).toBeUndefined();
  expect(ran.length).toBe(0);
});

test("amend --no-edit and non-commit commands pass unchecked", async ($, on) => {
  const ran = engine(on);
  expect((await commit($, "git commit --amend --no-edit")).deny).toBeUndefined();
  expect((await commit($, "git status")).deny).toBeUndefined();
  expect((await commit($, 'echo "git commit"; ls')).deny).toBeUndefined();
  expect(ran.length).toBe(0);
});

test("a heredoc message is checked", async ($, on) => {
  engine(on);
  const bad = "git commit -m \"$(cat <<'EOF'\nadded stuff\n\nbody here\nEOF\n)\"";
  expect((await commit($, bad)).deny).toBeDefined();
  const good = "git commit -m \"$(cat <<'EOF'\nchore(deps): bump x\n\nbody here\nEOF\n)\"";
  expect((await commit($, good)).deny).toBeUndefined();
});

test("-F file is read and checked", async ($, on) => {
  engine(on);
  expect((await commit($, "git commit -F msg.txt")).deny).toBeUndefined();
});
