/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as conventionalCommit from "./conventional_commit";
import * as requirements from "./requirements";
import { ExpressiveMessage } from "@dev-build-deploy/diagnose-it";

/**
 * Validation result interface
 * @interface IValidationResult
 * @member commit The commit that was validated
 * @member conventionalCommit The associated conventional commit
 * @member errors List of error messages
 */
export interface IValidationResult {
  commit: conventionalCommit.ICommit;
  conventionalCommit?: conventionalCommit.IConventionalCommit;
  errors: string[];
}

/**
 * Validates a single commit message against the Conventional Commit specification.
 * @param commit Commit message to validate against the Conventional Commit specification
 * @returns Validation result
 */
function validateCommit(commit: conventionalCommit.ICommit) {
  const result: IValidationResult = { commit: commit, errors: [] };

  try {
    result.conventionalCommit = conventionalCommit.parse(commit);
  } catch (error) {
    if (Array.isArray(error)) {
      error
        .filter(e => e instanceof requirements.RequirementError)
        .forEach(e => (e as requirements.RequirementError).errors.forEach(e => result.errors.push(e.message)));
    }
  }

  return result;
}

/**
 * Validates the pull request against CommitMe requirements.
 * @param pullrequest The pull request to validate
 * @param commits The commits associated with the pull request
 * @returns Validation result
 */
export function validatePullRequest(
  pullrequest: conventionalCommit.ICommit,
  commits: conventionalCommit.IConventionalCommit[]
) {
  const result = validateCommit(pullrequest);
  if (result.conventionalCommit === undefined) return result;

  const errors: requirements.RequirementError[] = [];
  for (const rule of requirements.pullRequestRules) {
    try {
      rule.validate(result.conventionalCommit, commits);
    } catch (error) {
      if (error instanceof requirements.RequirementError) errors.push(error);
    }
  }

  errors.forEach(e => e.errors.filter(e => e instanceof ExpressiveMessage).forEach(e => result.errors.push(e.message)));

  return result;
}

/**
 * Validates the given set of commit messages against the conventional commit specification.
 * @param commits The commits to validate
 * @returns A list of validation results
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
export function validateCommits(commits: conventionalCommit.ICommit[]): IValidationResult[] {
  return commits.filter(commit => !commit.message.startsWith("fixup!")).map(commit => validateCommit(commit));
}
