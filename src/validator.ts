/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as datasources from "./datasources";
import * as conventionalCommit from "./conventional_commit";
import { CommitExpressiveMessage } from "./conventional_commit";

/**
 * Validation result interface
 * @interface IValidationResult
 * @member commit The commit that was validated
 * @member errors List of error messages
 */
interface IValidationResult {
  commit: datasources.ICommit;
  errors: string[];
}

/**
 * Validates the given set of commit messages against the conventional commit specification.
 * @param commits The commits to validate
 * @returns A list of validation results
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
const validate = (commits: datasources.ICommit[]): IValidationResult[] => {
  const validationResults: IValidationResult[] = [];
  for (const commit of commits) {
    const result: IValidationResult = {
      commit: commit,
      errors: [],
    };

    try {
      conventionalCommit.parse(commit);
    } catch (error) {
      if (Array.isArray(error)) {
        error
          .filter(e => e instanceof conventionalCommit.RequirementError)
          .forEach(e =>
            (e as conventionalCommit.RequirementError).errors
              .filter(e => e instanceof CommitExpressiveMessage)
              .forEach(e => result.errors.push(e.message))
          );
      }
    }

    validationResults.push(result);
  }
  return validationResults;
};

export { validate };
