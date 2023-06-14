/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Configuration } from "../src/configuration";
import * as commit from "../src/conventional_commit";
import * as requirements from "../src/requirements";

const removeColors = (message: string) => {
  return message.replace(/\x1b\[[0-9;]*m/g, "");
};

const validateRequirement = (message: string, expected: string, body = "") => {
  const msg = {
    hash: "1234567890",
    message: message,
    body: body,
  };

  const debugOutput: string[] = [];
  try {
    commit.parse(msg);
    throw new Error(`Expected error message '${expected}', but no errors thrown.`);
  } catch (errors: any) {
    if (!Array.isArray(errors)) throw errors;
    let found = false;
    for (const error of errors) {
      if (!(error instanceof requirements.RequirementError)) throw error;
      debugOutput.push(error.toString());
      if (!found && removeColors(error.toString()).includes(expected)) found = true;
    }
    if (!found) {
      throw new Error(
        `Expected error message '${expected}' not found in: ${removeColors(errors.map(e => e.message).join("\n"))}`
      );
    }
  }
  console.log(debugOutput.join("\n"));
};

/**
 * Validates that the commit message is a valid conventional commit.
 */
describe("Conventional Commits specification", () => {
  test("Valid Conventional Commit subjects", () => {
    for (const subject of [
      "feat: add new feature",
      "fix: fix bug",
      "fix!: fix bug with breaking change",
      "docs: update documentation",
      "style: update style",
      "style(format): update style with scope",
      "refactor: refactor code",
      "test: update tests",
      "test(unit)!: update unit tests which leads to a breaking change",
      "chore: update build scripts",
    ]) {
      expect(() =>
        commit.parse({
          hash: "1234567890",
          message: subject,
          body: "",
        })
      ).not.toThrow();
    }
  });

  test("CC-01", () => {
    for (const message of [
      "(scope): missing type",
      ": missing type",
      "!: missing type",
      " !: missing type",
      "feat foot(scope)!: whatabout a noun",
      "feat123(scope)!: numbers arent nouns",
      "feat?#(scope): special characters arent nouns",
      "feat missing semicolon",
      "feat:missing space after semicolon",
      "feat : space before semicolon",
      "feat:   too many spaces after semicolon",
      "feat (scope): space between type and scope",
      "feat(scope) : space between scope and semicolon",
      "feat !: space between type and breaking change",
      "feat! : space between breaking change and semicolon",
      "feat foot (scope) ! :incorrect spaces everywhere",
    ]) {
      validateRequirement(
        message,
        "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space."
      );
    }
  });

  test("CC-04", () => {
    for (const message of [
      "feat(): empty scope",
      "feat(a noun): scope with spacing",
      "feat(1234): numbers arent nouns",
      "feat(?!): special characters arent nouns",
      "feat (?!) : special characters arent nouns",
    ]) {
      validateRequirement(
        message,
        "A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., fix(parser):"
      );
    }
  });

  test("CC-05", () => {
    for (const message of ["feat:", "feat: ", "feat:    ", "feat:   too many spaces after terminal colon"]) {
      validateRequirement(
        message,
        "A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., fix: array parsing issue when multiple spaces were contained in string."
      );
    }
  });
});

describe("Extended Conventional Commits specification", () => {
  beforeAll(() => {
    const config = Configuration.getInstance();
    config.scopes = ["action", "cli"];
    config.types = ["feat", "fix"];
  });

  test("EC-01", () => {
    for (const message of ["feat(wrong): unknown scope", "feat: no scope"]) {
      validateRequirement(
        message,
        "The scope is REQUIRED and the value MUST be one of the configured values (action, cli)."
      );
    }
  });

  test("EC-02", () => {
    for (const message of ["chore: unknown type", "docs(scope)!: unknown type"]) {
      validateRequirement(message, "The type MUST be one of the configured values (feat, fix).");
    }
  });
});

describe("Validate body of Commit Messages", () => {
  beforeAll(() => {
    const config = Configuration.getInstance();
    config.scopes = undefined;
    config.types = undefined;
  });

  test("Commit Message with body", () => {
    const message = `feat : this is a commit message with body`;
    const body = `This is the body of the commit message.
This is the second line of the body.

Acked-by: Kevin de Jong`;
    validateRequirement(
      message,
      "Commits MUST be prefixed with a type, which consists of a noun, feat, fix, etc., followed by the OPTIONAL scope, OPTIONAL !, and REQUIRED terminal colon and space.",
      body
    );
  });
});
