/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import assert from "assert";
import * as datasources from "./datasources";

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
interface IRawConventionalCommit {
  commit: datasources.ICommit;
  type?: string;
  scope?: string;
  breaking?: string;
  seperator?: string;
  spacing?: string;
  description?: string;
  body?: string;
}

/**
 * Conventional Commmit
 * @interface IConventionalCommit
 * @member type Conventional Commit type
 * @member scope Conventional Commit scope
 * @member breaking Commit message has a Conventional Commit breaking change (!)
 * @member subject Conventional Commit subject
 * @member body Commit message body
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
interface IConventionalCommit {
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
}

/**
 * Conventional Commit validation rule
 * @interface IRule
 * @member description Rule description
 * @member validate Validates the commit message
 */
interface IRequirements {
  id: number;
  description: string;
  /**
   * Validates the commit message against the Conventional Commit specification.
   * @throws RequirementError if the commit message is not a valid Conventional Commit
   * @param commit Commit message to validate against the Conventional Commit specification
   */
  validate(commit: IRawConventionalCommit): void;
}

/**
 * Error message with a caret pointing to the location of the error.
 * The message is loosely based on the LLVM "Expressive Diagnostics"
 * specification.
 * @member message Error message
 * @member hash Commit hash
 * @member line Commit message
 * @member start Start index of the error
 * @member end End index of the error
 *
 * @see https://clang.llvm.org/docs/ClangFormatStyleOptions.html#expressive-diagnostic-formatting
 */
class CommitExpressiveMessage {
  message: string;

  constructor(error: string, hash: string, line: string, start?: number, length?: number) {
    const GREEN = "\x1b[0;32m";
    const RED = "\x1b[1;31m";
    const RESET = "\x1b[0m\x1b[1m";

    const end = start !== undefined ? start + (length !== undefined ? length : 0) : undefined;
    const caret = this.addCaret(start, end);

    this.message = `\x1b[1m${hash}:1:${start}: ${RED}error:${RESET} ${error}\x1b[0m\n  ${line}`;
    if (caret) this.message += `\n  ${GREEN}${caret}\x1b[0m`;
  }

  /**
   * Creates a LLVM Expressive Diagnostics caret.
   * @returns string containing the error message with a caret
   * @see https://clang.llvm.org/docs/ClangFormatStyleOptions.html#expressive-diagnostic-formatting
   */
  private addCaret = (start?: number, end?: number) => {
    if (start === undefined || end === undefined) return "";
    return `${" ".repeat(start)}${"^".padEnd(end - start, "-")}`;
  };

  toString() {
    return this.message;
  }
}

/**
 * Range of a substring in a string.
 * @interface IRange
 * @member start Start index of the substring
 * @member length Length of the substring
 */
interface IRange {
  start: number;
  length: number;
}

/**
 * Ranges of Conventional Commit objects in the commit message.
 * @interface IIndices
 * @member type Range of the Conventional Commit type
 * @member scope Range of the Conventional Commit scope
 * @member breaking Range of the Conventional Commit breaking change
 * @member seperator Range of the Conventional Commit seperator
 * @member spacing Range of the Conventional Commit spacing
 * @member description Range of the Conventional Commit description
 */
interface IIndices {
  type?: IRange;
  scope?: IRange;
  breaking?: IRange;
  seperator?: IRange;
  spacing?: IRange;
  description?: IRange;
}

/**
 * Error thrown when a commit message does not meet the Conventional Commit specification.
 */
class RequirementError extends Error {
  commit: IRawConventionalCommit;
  description: string;
  errors: CommitExpressiveMessage[] = [];
  indices: IIndices;

  constructor(requirement: IRequirements, commit: IRawConventionalCommit) {
    super();

    this.commit = commit;
    this.description = requirement.description;
    this.message = `Non-compliant with the Conventional Commit Requirement #${requirement.id}`;

    this.indices = this.intializeIndices();
  }

  /**
   * Initializes all ranges of Conventional Commit objects in the commit message.
   */
  private intializeIndices = () => {
    const indices: IIndices = {};
    indices.type = { start: 0, length: this.commit.type?.length ?? 0 };
    indices.scope = {
      start: indices.type.start + indices.type.length,
      length: this.commit.scope?.length ?? 0,
    };
    indices.breaking = {
      start: indices.scope.start + indices.scope.length,
      length: this.commit.breaking?.length ?? 0,
    };
    indices.seperator = {
      start: indices.breaking.start + indices.breaking.length,
      length: this.commit.seperator?.length ?? 0,
    };
    indices.spacing = {
      start: indices.seperator.start + indices.seperator.length,
      length: this.commit.spacing?.length ?? 0,
    };
    indices.description = {
      start: indices.spacing.start + indices.spacing.length,
      length: this.commit.description?.length ?? 0,
    };
    return indices;
  };

  /**
   * Extends the output with another error message
   * @param highlight String to highlight in the Conventional Commit specification description
   * @param type Type of the Conventional Commit to highlight in the Conventional Commit subject
   */
  addError(
    highlight: string | string[],
    type: "type" | "scope" | "breaking" | "seperator" | "spacing" | "description"
  ) {
    const index = this.indices[type.toString() as keyof IIndices] as IRange;
    this.errors.push(
      new CommitExpressiveMessage(
        this.highlightString(this.description, highlight),
        this.commit.commit.hash,
        this.commit.commit.message,
        index.start,
        index.length
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
  private highlightString = (str: string, substring: string | string[]) => {
    const HIGHLIGHT = "\x1b[1;36m";
    const RESET = "\x1b[0m\x1b[1m";

    // Ensure that we handle both single and multiple substrings equally
    if (!Array.isArray(substring)) substring = [substring];

    // Replace all instances of substring with a blue version
    let result = str;
    substring.forEach(sub => (result = result.replace(sub, `${HIGHLIGHT}${sub}${RESET}`)));
    return result;
  };
}

/**
 * Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc.,
 * followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.
 */
class Requirement1 implements IRequirements {
  id = 1;
  description =
    "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.";
  validate(commit: IRawConventionalCommit) {
    const error = new RequirementError(this, commit);

    // MUST be prefixed with a type
    if (!commit.type || commit.type.trim().length === 0) {
      error.addError("MUST be prefixed with a type", "type");
    } else {
      // Ensure that we have a noun
      if (commit.type.trim().includes(" ") || /[^a-z]/i.test(commit.type.trim()))
        error.addError("which consists of a noun", "type");
      // Validate for spacing after the type
      if (commit.type.trim() !== commit.type) {
        if (commit.scope) error.addError("followed by the OPTIONAL scope", "scope");
        else if (commit.breaking) error.addError(["followed by the", "OPTIONAL !"], "breaking");
        else error.addError(["followed by the", "REQUIRED terminal colon"], "seperator");
      }

      // Validate for spacing after the scope, breaking and seperator
      if (commit.scope && commit.scope.trim() !== commit.scope)
        error.addError("followed by the OPTIONAL scope", "scope");
      if (commit.breaking && commit.breaking.trim() !== commit.breaking)
        error.addError(["followed by the", "OPTIONAL !"], "breaking");
      if (commit.seperator && commit.seperator.trim() !== commit.seperator)
        error.addError(["followed by the", "REQUIRED terminal colon"], "seperator");
    }

    // MUST have a terminal colon
    if (!commit.seperator) error.addError(["followed by the", "REQUIRED terminal colon"], "seperator");
    // MUST have a space after the terminal colon
    else if (!commit.spacing || commit.spacing.length !== 1)
      error.addError(["followed by the", "REQUIRED", "space"], "spacing");

    if (error.errors.length > 0) throw error;
  }
}

/**
 * A scope MAY be provided after a type. A scope MUST consist of a noun describing
 * a section of the codebase surrounded by parenthesis, e.g., fix(parser):
 */
class Requirement4 implements IRequirements {
  id = 4;
  description =
    "A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., fix(parser):";

  validate(commit: IRawConventionalCommit): void {
    const error = new RequirementError(this, commit);
    if (
      commit.scope &&
      (commit.scope.includes(" ") ||
        commit.scope === "()" ||
        /[^a-z]/i.test(commit.scope.substring(1, commit.scope.length - 1)))
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
class Requirement5 implements IRequirements {
  id = 5;
  description =
    "A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., fix: array parsing issue when multiple spaces were contained in string.";
  validate(commit: IRawConventionalCommit) {
    const error = new RequirementError(this, commit);
    if (!commit.seperator) return;
    if (!commit.spacing || commit.spacing.length > 1 || !commit.description)
      error.addError("A description MUST immediately follow the colon and space", "description");

    if (error.errors.length > 0) throw error;
  }
}

/**
 * Validates a commit message against the Conventional Commit specification.
 * @param commit Commit message to validate against the Conventional Commit specification
 * @returns Conventional Commit mesage
 * @throws RequirementError[] if the commit message is not a valid Conventional Commit
 * @see https://www.conventionalcommits.org/en/v1.0.0/
 */
const validate = (commit: IRawConventionalCommit): IConventionalCommit => {
  const errors: Error[] = [];
  for (const rule of rules) {
    try {
      rule.validate(commit);
    } catch (error) {
      if (error instanceof RequirementError) errors.push(error);
    }
  }
  if (errors.length > 0) throw errors;

  // Assume that we have a valid Conventional Commit message
  assert(commit.type);
  assert(commit.description);

  return {
    type: commit.type,
    scope: commit.scope,
    breaking: commit.breaking === "!",
    subject: commit.description,
  };
};

/**
 * Parses a Commit message into a Conventional Commit.
 * @param commit Commit message to parse
 * @throws RequirementError[] if the commit message is not a valid Conventional Commit
 * @returns Conventional Commit
 */
const parse = (commit: datasources.ICommit): IConventionalCommit => {
  const ConventionalCommitRegex =
    // /^(?<type>[^(!:]*)(\((?<scope>.*)\))?(?<breaking>\s*!)?(?<separator>\s*:)?(?<spacing>\s*)(?<subject>.*)?$/;
    /^(?<type>[^(!:]*)(?<scope>\(.*\))?(?<breaking>\s*!)?(?<separator>\s*:)?(?<spacing>\s*)(?<subject>.*)?$/;

  const match = commit.message.match(ConventionalCommitRegex);
  const conventionalCommit: IRawConventionalCommit = {
    commit: commit,
    type: match?.groups?.type,
    scope: match?.groups?.scope,
    breaking: match?.groups?.breaking,
    seperator: match?.groups?.separator,
    spacing: match?.groups?.spacing,
    description: match?.groups?.subject,
    body: commit.body,
  };

  return validate(conventionalCommit);
};

const rules: IRequirements[] = [new Requirement1(), new Requirement4(), new Requirement5()];

export { parse, RequirementError };
