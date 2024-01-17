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
      Commit.fromString({ hash: "0a0b0c0d", message: "feat: Add new feature" }),
      [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat: Add new feature" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "fix: Fixed a bug" }),
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
});

describe("Validate invalid Pull Request vs Commits", () => {
  const testData = [
    {
      description: "Invalid Pull Request",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "feat (no noun): Add new feature" }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat: add new feature" }),
      ],
      errorCount: 2,
    },
    {
      description: "Valid and Invalid Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "feat: Add new feature" }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat (no noun)!: silly change" }),
      ],
      errorCount: 0,
    },
    {
      description: "Only Invalid Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "feat: Add new feature" }),
      commits: [ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat (no noun)!: silly change" })],
      errorCount: 0,
    },
    {
      description: "No Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "feat: Add new feature" }),
      commits: [],
      errorCount: 0,
    },
  ];

  it.each(testData)("$test.description", test => {
    const result = validator.validatePullRequest(test.pullRequest, test.commits);
    expect(result.errors.length).toBe(test.errorCount);
  });
});

describe("Validate valid Pull Request vs Commits", () => {
  const testData = [
    {
      description: "Pull Request < Commit",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
      commits: [ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat: add new feature" })],
      error: true,
    },
    {
      description: "Pull Request < Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat: add new feature" }),
      ],
      error: true,
    },
    {
      description: "Breaking Pull Request === Breaking Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "chore!: silly change" }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat!: add new feature" }),
      ],
      error: false,
    },
    {
      description: "Pull Request === Invalid Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "feat: add a new feature" }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore (no noun): silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "add new feature" }),
      ],
      error: false,
    },
    {
      description: "Pull Request === No Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "feat: add a new feature" }),
      commits: [],
      error: false,
    },
    {
      description: "Pull Request (BREAKING CHANGE) === Breaking Commits",
      pullRequest: Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat: add a new feature\n\nBREAKING-CHANGE: This is breaking",
      }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat!: add new feature" }),
      ],
      error: false,
    },
    {
      description: "Pull Request (BREAKING CHANGE) === Commits (BREAKING CHANGE)",
      pullRequest: Commit.fromString({
        hash: "0a0b0c0d",
        message: "feat: add a new feature\n\nBREAKING-CHANGE: This is breaking",
      }),
      commits: [
        ConventionalCommit.fromString({
          hash: "0a0b0c0d",
          message: "chore: silly change\n\nBREAKING CHANGE: This is breaking?",
        }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "feat: add new feature" }),
      ],
      error: false,
    },
    {
      description: "Pull Request (BREAKING CHANGE) > Commits",
      pullRequest: Commit.fromString({
        hash: "0a0b0c0d",
        message: "fix: add fix\n\nBREAKING-CHANGE: This is breaking",
      }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "fix: fixed a bug" }),
      ],
      error: false,
    },
    {
      description: "Pull Request > Commits",
      pullRequest: Commit.fromString({ hash: "0a0b0c0d", message: "feat: add a new feature" }),
      commits: [
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "chore: silly change" }),
        ConventionalCommit.fromString({ hash: "0a0b0c0d", message: "fix: fixed a bug" }),
      ],
      error: false,
    },
  ];

  it.each(testData)("$test.description", test => {
    const result = validator.validatePullRequest(test.pullRequest, test.commits);

    if (test.error) {
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message.text).toBe(
        "A Pull Request MUST correlate with a Semantic Versioning identifier (`MAJOR`, `MINOR`, or `PATCH`) with the same or higher precedence than its associated commits"
      );
    } else {
      expect(result.errors.length).toBe(0);
    }
  });
});

describe("Ignore fixup and merge commits", () => {
  const testData = [
    "fixup! feat: add new feature",
    "fixup! fixup! feat: add new feature",
    "Merge pull request #123 from some-branch/feature/branch",
    "Merge pull request #123 from 'some-branch/feature/branch'",
    "Merged in ci/some-branch (pull request #123)",
    "Merged in 'ci/some-branch' (pull request #123)",
    "Merge branch 'ci/some-branch' into 'main'",
    "Merge branch 'ci/some-branch' into main",
    "Merge branch ci/some-branch into main",
  ];

  it.each(testData)("$test", test => {
    const result = validator.validateCommits([Commit.fromString({ hash: "0a0b0c0d", message: test })]);

    expect(result.length).toBe(0);
  });
});
