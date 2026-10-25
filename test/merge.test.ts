/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { isGitMergeMessage, isMergeInProgress } from "../src/merge.js";

describe("Merge subjects", () => {
  test("Git generated subjects", () => {
    expect(isGitMergeMessage("Merge branch 'x'\n\n# Conflicts:\n")).toBe(true);
    expect(isGitMergeMessage("Merge tag 'v1'")).toBe(true);
    expect(isGitMergeMessage("feat: Merge branch support")).toBe(false);
  });
});

describe("Merge in progress", () => {
  const git = (cwd: string, ...args: string[]): Buffer =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd, stdio: "ignore" });

  test("MERGE_HEAD detection", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "commit-me-"));
    try {
      git(dir, "init", "-q", "-b", "main");
      git(dir, "commit", "-q", "--allow-empty", "-m", "feat: init");
      git(dir, "checkout", "-q", "-b", "other");
      git(dir, "commit", "-q", "--allow-empty", "-m", "feat: other");
      git(dir, "checkout", "-q", "main");
      git(dir, "commit", "-q", "--allow-empty", "-m", "feat: main");
      expect(isMergeInProgress(dir)).toBe(false);
      git(dir, "merge", "--no-commit", "--no-ff", "other");
      expect(isMergeInProgress(dir)).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("Outside a repository", () => {
    expect(isMergeInProgress(fs.mkdtempSync(path.join(os.tmpdir(), "commit-me-")))).toBe(false);
  });
});
