/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { Commit, ConventionalCommit } from "@dev-build-deploy/commit-it";
import { DiagnosticsMessage, FixItHint } from "@dev-build-deploy/diagnose-it";

import { Configuration } from "./configuration";

/**
 * Validates a single commit message against the Conventional Commit specification.
 * @param commit Commit message to validate against the Conventional Commit specification
 * @returns Validation result
 */
function validateCommit(commit: Commit): ConventionalCommit {
  return ConventionalCommit.fromCommit(commit, Configuration.getInstance());
}

/**
 * Validates the pull request against CommitMe requirements.
 * @param pullrequest The pull request to validate
 * @param commits The commits associated with the pull request
 * @returns Validation result
 */
export function validatePullRequest(pullrequest: Commit, commits: ConventionalCommit[]): ConventionalCommit {
  const result = validateCommit(pullrequest);

  if (!result.isValid) return result;

  const orderValue = (commit: ConventionalCommit): number => {
    if (commit.breaking) return 3;
    if (commit.type?.toLowerCase() === "feat") return 2;
    if (commit.type?.toLowerCase() === "fix") return 1;
    return 0;
  };

  const pullRequestValue = orderValue(result);
  const validConventionalCommits = commits.filter(commit => commit.isValid);
  const commitsValue = orderValue(validConventionalCommits.sort((a, b) => (orderValue(a) < orderValue(b) ? 1 : -1))[0]);

  if (pullRequestValue < commitsValue) {
    result.errors.push(
      DiagnosticsMessage.createError(result.hash, {
        text: `A Pull Request title MUST correlate with a Semantic Versioning identifier (\`MAJOR\`, \`MINOR\`, or \`PATCH\`) with the same or higher precedence than its associated commits`,
        linenumber: 1,
        column: 1,
      })
        .setContext(1, result.subject)
        .addFixitHint(FixItHint.create({ index: 1, length: result.type?.length ?? 1 }))
    );
  }

  return result;
}

/**
 * Validates the given set of commit messages against the conventional commit specification.
 * @param commits The commits to validate
 * @returns A list of validation results
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
export function validateCommits(commits: Commit[]): ConventionalCommit[] {
  return commits.filter(commit => !commit.subject.startsWith("fixup!")).map(commit => validateCommit(commit));
}
