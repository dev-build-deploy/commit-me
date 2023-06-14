/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
SPDX-License-Identifier: CC-BY-3.0
*/

import { IConventionalCommit, IConventionalCommitElement, IRawConventionalCommit } from "./conventional_commit";
import { Configuration } from "./configuration";
import { ExpressiveMessage } from "@dev-build-deploy/diagnose-it";

/**
 * Requirement interface
 * @interface IRequirement
 * @member id Requirement identifier
 * @member description Description of the requirement
 */
interface IRequirement {
  id: string;
  description: string;
}

/**
 * Conventional Commit requirement
 * @interface ICommitRequirement
 * @member validate Validates the commit message
 */
interface ICommitRequirement extends IRequirement {
  /**
   * Validates the commit message against the Conventional Commit specification.
   * @throws RequirementError if the commit message is not a valid Conventional Commit
   * @param commit Raw conventional commit data to validate
   */
  validate(commit: IRawConventionalCommit): void;
}

/**
 * Pull Request requirement
 * @interface IPullRequestRequirement
 * @member validate Validates the pull request
 */
interface IPullRequestRequirement extends IRequirement {
  /**
   * Validates the pull request against CommitMe requirements.
   * @throws RequirementError if the pull request does not comply
   * @param data Data to validate
   */
  validate(pullrequest: IConventionalCommit, commits?: IConventionalCommit[]): void;
}

/**
 * Error thrown when a commit message does not meet the Conventional Commit specification.
 */
export class RequirementError extends Error {
  commit: IRawConventionalCommit;
  description: string;
  errors: ExpressiveMessage[] = [];

  constructor(requirement: IRequirement, commit: IRawConventionalCommit) {
    super();

    this.commit = commit;
    this.description = requirement.description;
    this.message = `Non-compliant with the requirement ${requirement.id}`;
  }

  /**
   * Extends the output with another error message
   * @param highlight String to highlight in the Conventional Commit specification description
   * @param type Type of the Conventional Commit to highlight in the Conventional Commit subject
   */
  addError(
    highlight: string | string[],
    type: "type" | "scope" | "breaking" | "seperator" | "spacing" | "description"
  ) {
    const data = this.commit[type.toString() as keyof IRawConventionalCommit] as IConventionalCommitElement;

    this.errors.push(
      new ExpressiveMessage()
        .id(this.commit.commit.hash)
        .error(this.highlightString(this.description, highlight))
        .columnNumber(data.index)
        .context(
          this.commit.commit.body.split("\n").length > 1 && this.commit.commit.body[0] !== ""
            ? [this.commit.commit.message, "", ...this.commit.commit.body.split("\n")]
            : [this.commit.commit.message],
          0,
          data.value?.length || 0
        )
    );
    this.message = this.errors.map(e => e.toString()).join("\n");
  }

  /**
   * Highlights the substring(s) in the specified string in cyan.
   * @param str original string
   * @param substring substring(s) to highlight (in cyan)
   * @returns string containing highlighted sections in cyan
   */
  private highlightString(str: string, substring: string | string[]) {
    const HIGHLIGHT = "\x1b[1;36m";
    const RESET = "\x1b[0m\x1b[1m";

    // Ensure that we handle both single and multiple substrings equally
    if (!Array.isArray(substring)) substring = [substring];

    // Replace all instances of substring with a blue version
    let result = str;
    substring.forEach(sub => (result = result.replace(sub, `${HIGHLIGHT}${sub}${RESET}`)));
    return result;
  }
}

/**
 * Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc.,
 * followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.
 */
class CC01 implements ICommitRequirement {
  id = "CC-01";
  description =
    "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.";
  validate(commit: IRawConventionalCommit) {
    const error = new RequirementError(this, commit);

    // MUST be prefixed with a type
    if (!commit.type.value || commit.type.value.trim().length === 0) {
      error.addError("MUST be prefixed with a type", "type");
    } else {
      // Ensure that we have a noun
      if (commit.type.value.trim().includes(" ") || /[^a-z]/i.test(commit.type.value.trim()))
        error.addError("which consists of a noun", "type");
      // Validate for spacing after the type
      if (commit.type.value.trim() !== commit.type.value) {
        if (commit.scope.value) error.addError("followed by the OPTIONAL scope", "scope");
        else if (commit.breaking.value) error.addError(["followed by the", "OPTIONAL !"], "breaking");
        else error.addError(["followed by the", "REQUIRED terminal colon"], "seperator");
      }

      // Validate for spacing after the scope, breaking and seperator
      if (commit.scope.value && commit.scope.value.trim() !== commit.scope.value)
        error.addError("followed by the OPTIONAL scope", "scope");
      if (commit.breaking.value && commit.breaking.value.trim() !== commit.breaking.value)
        error.addError(["followed by the", "OPTIONAL !"], "breaking");
      if (commit.seperator.value && commit.seperator.value.trim() !== commit.seperator.value)
        error.addError(["followed by the", "REQUIRED terminal colon"], "seperator");
    }

    // MUST have a terminal colon
    if (!commit.seperator.value) error.addError(["followed by the", "REQUIRED terminal colon"], "seperator");
    // MUST have a space after the terminal colon
    else if (!commit.spacing.value || commit.spacing.value.length !== 1)
      error.addError(["followed by the", "REQUIRED", "space"], "spacing");

    if (error.errors.length > 0) throw error;
  }
}

/**
 * A scope MAY be provided after a type. A scope MUST consist of a noun describing
 * a section of the codebase surrounded by parenthesis, e.g., fix(parser):
 */
class CC04 implements ICommitRequirement {
  id = "CC-04";
  description =
    "A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., fix(parser):";

  validate(commit: IRawConventionalCommit): void {
    const error = new RequirementError(this, commit);
    if (
      commit.scope.value &&
      (commit.scope.value.includes(" ") ||
        commit.scope.value === "()" ||
        /[^a-z]/i.test(commit.scope.value.substring(1, commit.scope.value.length - 1)))
    ) {
      error.addError("A scope MUST consist of a noun", "scope");
    }
    if (error.errors.length > 0) throw error;
  }
}

/**
 * A description MUST immediately follow the colon and space after the type/scope prefix.
 * The description is a short summary of the code changes, e.g., fix: array parsing issue
 * when multiple spaces were contained in string.
 */
class CC05 implements ICommitRequirement {
  id = "CC-05";
  description =
    "A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., fix: array parsing issue when multiple spaces were contained in string.";
  validate(commit: IRawConventionalCommit) {
    const error = new RequirementError(this, commit);
    if (!commit.seperator.value) return;
    if (!commit.spacing.value || commit.spacing.value.length > 1 || !commit.description.value)
      error.addError("A description MUST immediately follow the colon and space", "description");

    if (error.errors.length > 0) throw error;
  }
}

/**
 * The scope is REQUIRED and the value MUST be one of the configured values (...)
 */
class EC01 implements ICommitRequirement {
  id = "EC-01";
  description = "The scope is REQUIRED and the value MUST be one of the configured values (...)";

  validate(commit: IRawConventionalCommit) {
    const config = Configuration.getInstance();

    this.description = `The scope is REQUIRED and the value MUST be one of the configured values (${config?.scopes?.join(
      ", "
    )}).`;
    if (config.scopes === undefined || config.scopes?.length === 0) return;
    if (commit.scope.value !== undefined && config.scopes.includes(commit.scope.value.replace(/[()]+/g, ""))) return;

    const error = new RequirementError(this, commit);
    error.addError(["scope is REQUIRED", "and", "MUST be one of the configured values"], "scope");
    throw error;
  }
}

/**
 * The type MUST be one of the configured values (...)
 */
class EC02 implements ICommitRequirement {
  id = "EC-02";
  description = "The type MUST be one of the configured values (...)";

  validate(commit: IRawConventionalCommit) {
    const config = Configuration.getInstance();

    this.description = `The type MUST be one of the configured values (${config?.types?.join(", ")}).`;
    if (config.types === undefined || config.types?.length === 0) return;
    if (commit.type.value !== undefined && config.types.includes(commit.type.value)) return;

    const error = new RequirementError(this, commit);
    error.addError("type MUST be one of the configured values", "type");
    throw error;
  }
}

/**
 * A Pull Request title MUST correlate with a Semantic Versioning identifier (`MAJOR`, `MINOR`,
 * or `PATCH`) with the same or higher precedence than its associated commits.
 */
class PR01 implements IPullRequestRequirement {
  id = "PR-01";
  description =
    "A Pull Request title MUST correlate with a Semantic Versioning identifier (`MAJOR`, `MINOR`, or `PATCH`) with the same or higher precedence than its associated commits.";
  validate(pullrequest: IConventionalCommit, commits: IConventionalCommit[]) {
    const error = new RequirementError(this, pullrequest.raw);

    const orderValue = (commit?: IConventionalCommit) => {
      if (!commit) return 0;
      if (commit.breaking) return 3;
      if (commit.type === "feat") return 2;
      if (commit.type === "fix") return 1;
      return 0;
    };

    const pullRequestValue = orderValue(pullrequest);
    const commitsValue = orderValue(commits.sort((a, b) => (orderValue(a) < orderValue(b) ? 1 : -1))[0]);

    if (pullRequestValue < commitsValue) {
      error.addError(
        [
          "title MUST correlate with a Semantic Versioning identifier",
          "with the same or higher precedence than its associated commits",
        ],
        "type"
      );
    }

    if (error.errors.length > 0) throw error;
  }
}

export const commitRules: ICommitRequirement[] = [new CC01(), new CC04(), new CC05(), new EC01(), new EC02()];
export const pullRequestRules: IPullRequestRequirement[] = [new PR01()];
