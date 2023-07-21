/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import { ExpressiveMessage } from "@dev-build-deploy/diagnose-it";
import {
  ICommit,
  IConventionalCommit,
  getConventionalCommit,
  ConventionalCommitError,
} from "@dev-build-deploy/commit-it";
import { Configuration } from "./configuration";

/**
 * Validation result interface
 * @interface IValidationResult
 * @member commit The commit that was validated
 * @member conventionalCommit The associated conventional commit
 * @member errors List of error messages
 */
export interface IValidationResult {
  commit: ICommit | IConventionalCommit;
  errors: string[];
}

/**
 * Validates a single commit message against the Conventional Commit specification.
 * @param commit Commit message to validate against the Conventional Commit specification
 * @returns Validation result
 */
function validateCommit(commit: ICommit) {
  const result: IValidationResult = { commit: commit, errors: [] };

  try {
    result.commit = getConventionalCommit(commit, Configuration.getInstance());
  } catch (error) {
    if (!(error instanceof ConventionalCommitError)) throw error;
    error.errors.forEach(e => result.errors.push(e.message));
  }

  return result;
}

/**
 * Validates the pull request against CommitMe requirements.
 * @param pullrequest The pull request to validate
 * @param commits The commits associated with the pull request
 * @returns Validation result
 */
export function validatePullRequest(pullrequest: ICommit, commits: IConventionalCommit[]) {
  const result = validateCommit(pullrequest);

  if (result.errors.length > 0) return result;

  const orderValue = (commit?: ICommit | IConventionalCommit) => {
    if (!commit || !("type" in commit)) return 0;
    if (commit.breaking) return 3;
    if (commit.type === "feat") return 2;
    if (commit.type === "fix") return 1;
    return 0;
  };

  const pullRequestValue = orderValue(result.commit);
  const commitsValue = orderValue(commits.sort((a, b) => (orderValue(a) < orderValue(b) ? 1 : -1))[0]);

  if (pullRequestValue < commitsValue) {
    result.errors.push(
      new ExpressiveMessage()
        .id(result.commit.hash)
        .error(
          `A Pull Request title MUST correlate with a Semantic Versioning identifier (\`MAJOR\`, \`MINOR\`, or \`PATCH\`) with the same or higher precedence than its associated commits`
        )
        .lineNumber(1)
        .caret(0, 0)
        .toString()
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
export function validateCommits(commits: ICommit[]): IValidationResult[] {
  return commits.filter(commit => !commit.subject.startsWith("fixup!")).map(commit => validateCommit(commit));
}
