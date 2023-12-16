/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { Commit, ConventionalCommit } from "@dev-build-deploy/commit-it";

import * as validator from "../src/validator";

describe("Validate commit messages", () => {
  test("Valid commit message", () => {
    const result = validator.validateCommits([
      Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat: Add new feature",
      }),
    ]);

    let count = 0;
    result.forEach(item => (count += item.errors.length));
    expect(count).toBe(0);
  });

  test("Invalid commit message", () => {
    const result = validator.validateCommits([
      Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat (no noun): Add new feature",
      }),
    ]);

    let count = 0;
    result.forEach(item => (count += item.errors.length));

    // Space in between type and scope
    // Scope is not a noun
    expect(count).toBe(2);
  });

  test("Commit messages with warnings", () => {
    const result = validator.validateCommits([
      Commit.fromString({
        hash: "0a0b0c0d",
        message: `feat: Add new feature

BREAKING CHANGE: this will be ignored and raise a warning...

... as it is followed by a new paragraph`,
      }),
    ]);

    let errorCount = 0;
    let warningCount = 0;
    result.forEach(item => (errorCount += item.errors.length));
    result.forEach(item => (warningCount += item.warnings.length));
    expect(errorCount).toBe(0);
    expect(warningCount).toBe(1);
  });

  test("Valid Pull Request message", () => {
    const result = validator.validatePullRequest(
      Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat: Add new feature",
      }),
      [
        ConventionalCommit.fromString({
          hash: "0a0b0c0d",
          message: "feat: Add new feature",
        }),
        ConventionalCommit.fromString({
          hash: "0a0b0c0d",
          message: "fix: Fixed a bug",
        }),
      ]
    );

    expect(result.errors.length).toBe(0);
  });

  test("Invalid Pull Request message", () => {
    const result = validator.validatePullRequest(
      Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat (no noun): Add new feature",
      }),
      [
        ConventionalCommit.fromString({
          hash: "0a0b0c0d",
          message: "feat: Add new feature",
        }),
      ]
    );

    // Space in between type and scope
    // Scope is not a noun
    expect(result.errors.length).toBe(2);
  });

  test("Pull Request > Commits", () => {
    const result = validator.validatePullRequest(
      Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat!: Add new breaking change",
      }),
      [
        ConventionalCommit.fromString({
          hash: "0a0b0c0d",
          message: "feat: Add new feature",
        }),
      ]
    );

    expect(result.errors.length).toBe(0);
  });

  test("Pull Request === Commits", () => {
    const result = validator.validatePullRequest(
      Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat: Add new feature",
      }),
      [
        ConventionalCommit.fromString({
          hash: "0a0b0c0d",
          message: "feat: Add new feature",
        }),
      ]
    );

    expect(result.errors.length).toBe(0);
  });

  test("Pull Request < Commits", () => {
    const result = validator.validatePullRequest(
      Commit.fromString({
        hash: "0a0b0c0d",
        message: "chore: Add new breaking change",
      }),
      [
        ConventionalCommit.fromString({
          hash: "0a0b0c0d",
          message: "feat: Add new feature",
        }),
      ]
    );

    // Pull Request < Commits
    expect(result.errors.length).toBe(1);
  });
});
