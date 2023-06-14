/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import assert from "assert";
import * as requirements from "./requirements";

/**
 * Commit information
 * @interface ICommit
 * @member hash The commit hash
 * @member message The commit message
 * @member body The commit body
 */
export interface ICommit {
  hash: string;
  message: string;
  body: string;
}

/**
 * Conventional Commit element
 * @interface IConventionalCommitElement
 * @member index Index of the element in the commit message
 * @member value Value of the element in the commit message
 */
export type IConventionalCommitElement = {
  index: number;
  value?: string;
};

/**
 * Raw data structure used to validate a Commit message against the Conventional Commit specification.
 * @interface IRawConventionalCommit
 * @member commit Original commit
 * @member type Conventional Commit type
 * @member scope Conventional Commit scope
 * @member seperator Commit message has a Conventional Commit seperator (:)
 * @member breaking Commit message has a Conventional Commit breaking change (!)
 * @member subject Conventional Commit subject
 * @member body Commit message body
 */
export interface IRawConventionalCommit {
  commit: ICommit;
  type: IConventionalCommitElement;
  scope: IConventionalCommitElement;
  breaking: IConventionalCommitElement;
  seperator: IConventionalCommitElement;
  spacing: IConventionalCommitElement;
  description: IConventionalCommitElement;
  body: IConventionalCommitElement;
}

/**
 * Conventional Commmit
 * @interface IConventionalCommit
 * @member raw Raw data structure used to validate a Commit message against the Conventional Commit specification
 * @member type Conventional Commit type
 * @member scope Conventional Commit scope
 * @member breaking Commit message has a Conventional Commit breaking change (!)
 * @member subject Conventional Commit subject
 * @member body Commit message body
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
export interface IConventionalCommit {
  raw: IRawConventionalCommit;
  type: string;
  scope?: string;
  breaking: boolean;
  description: string;
}

/**
 * Validates a commit message against the Conventional Commit specification.
 * @param commit Commit message to validate against the Conventional Commit specification
 * @returns Conventional Commit mesage
 * @throws RequirementError[] if the commit message is not a valid Conventional Commit
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
function validate(commit: IRawConventionalCommit): IConventionalCommit {
  const errors: Error[] = [];
  for (const rule of requirements.commitRules) {
    try {
      rule.validate(commit);
    } catch (error) {
      if (error instanceof requirements.RequirementError) errors.push(error);
    }
  }
  if (errors.length > 0) throw errors;

  // Assume that we have a valid Conventional Commit message
  assert(commit.type.value);
  assert(commit.description.value);

  return {
    raw: commit,
    type: commit.type.value,
    scope: commit.scope.value,
    breaking: commit.breaking.value === "!",
    description: commit.description.value,
  };
}

/**
 * Parses a Commit message into a Conventional Commit.
 * @param commit Commit message to parse
 * @throws RequirementError[] if the commit message is not a valid Conventional Commit
 * @returns Conventional Commit
 */
export function parse(commit: ICommit): IConventionalCommit {
  const ConventionalCommitRegex = new RegExp(
    /^(?<type>[^(!:]*)(?<scope>\(.*\))?(?<breaking>\s*!)?(?<separator>\s*:)?(?<spacing>\s*)(?<subject>.*)?$/
  );

  const match = ConventionalCommitRegex.exec(commit.message);
  let conventionalCommit: IRawConventionalCommit = {
    commit: commit,
    type: { index: 0, value: match?.groups?.type },
    scope: { index: 0, value: match?.groups?.scope },
    breaking: { index: 0, value: match?.groups?.breaking },
    seperator: { index: 0, value: match?.groups?.separator },
    spacing: { index: 0, value: match?.groups?.spacing },
    description: { index: 0, value: match?.groups?.subject },
    body: { index: 0, value: commit.body },
  };

  function intializeIndices(commit: IRawConventionalCommit) {
    commit.scope.index = commit.type.index + (commit.type.value?.length ?? 0);
    commit.breaking.index = commit.scope.index + (commit.scope.value?.length ?? 0);
    commit.seperator.index = commit.breaking.index + (commit.breaking.value?.length ?? 0);
    commit.spacing.index = commit.seperator.index + (commit.seperator.value?.length ?? 0);
    commit.description.index = commit.spacing.index + (commit.spacing.value?.length ?? 0);
    return commit;
  }

  conventionalCommit = intializeIndices(conventionalCommit);

  return validate(conventionalCommit);
}
