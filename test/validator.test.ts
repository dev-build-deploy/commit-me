/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import * as validator from "../src/validator";

describe("Validate commit messages", () => {
  test("Valid commit message", () => {
    const result = validator.validateCommits([
      {
        hash: "0a0b0c0d",
        subject: "feat: Add new feature",
        body: "This is a body",
        footer: {
          "Acked-by": "Jane Doe",
        },
      },
    ]);
    let count = 0;
    result.forEach(item => (count += item.errors.length));
    expect(count).toBe(0);
  });

  test("Invalid commit message", () => {
    const result = validator.validateCommits([
      {
        hash: "0a0b0c0d",
        subject: "feat (no noun): Add new feature",
        body: "This is a body",
        footer: {
          "Acked-by": "Jane Doe",
        },
      },
    ]);
    let count = 0;
    result.forEach(item => (count += item.errors.length));

    // Space in between type and scope
    // Scope is not a noun
    expect(count).toBe(2);
  });

  test("Valid Pull Request message", () => {
    const result = validator.validatePullRequest(
      {
        hash: "0a0b0c0d",
        subject: "feat: Add new feature",
        body: "This is a body",
        footer: {
          "Acked-by": "Jane Doe",
        },
      },
      [
        {
          hash: "0a0b0c0d",
          type: "feat",
          description: "Add new feature",
          subject: "feat: Add new feature",
          body: "This is a body",
          footer: {
            "Acked-by": "Jane Doe",
          },
        },
      ]
    );

    expect(result.errors.length).toBe(0);
  });

  test("Invalid Pull Request message", () => {
    const result = validator.validatePullRequest(
      {
        hash: "0a0b0c0d",
        subject: "feat (no noun): Add new feature",
        body: "This is a body",
        footer: {
          "Acked-by": "Jane Doe",
        },
      },
      [
        {
          hash: "0a0b0c0d",
          type: "feat",
          description: "Add new feature",
          subject: "feat: Add new feature",
          body: "This is a body",
          footer: {
            "Acked-by": "Jane Doe",
          },
        },
      ]
    );

    // Space in between type and scope
    // Scope is not a noun
    expect(result.errors.length).toBe(2);
  });

  test("Pull Request > Commits", () => {
    const result = validator.validatePullRequest(
      {
        hash: "0a0b0c0d",
        subject: "feat!: Add new breaking change",
        body: "This is a body",
        footer: {
          "Acked-by": "Jane Doe",
        },
      },
      [
        {
          hash: "0a0b0c0d",
          type: "feat",
          description: "Add new feature",
          subject: "feat: Add new feature",
          body: "This is a body",
          footer: {
            "Acked-by": "Jane Doe",
          },
        },
      ]
    );

    expect(result.errors.length).toBe(0);
  });

  test("Pull Request === Commits", () => {
    const result = validator.validatePullRequest(
      {
        hash: "0a0b0c0d",
        subject: "feat: Add new breaking change",
        body: "This is a body",
        footer: {
          "Acked-by": "Jane Doe",
        },
      },
      [
        {
          hash: "0a0b0c0d",
          type: "feat",
          description: "Add new feature",
          subject: "feat: Add new feature",
          body: "This is a body",
          footer: {
            "Acked-by": "Jane Doe",
          },
        },
      ]
    );

    expect(result.errors.length).toBe(0);
  });

  test("Pull Request < Commits", () => {
    const result = validator.validatePullRequest(
      {
        hash: "0a0b0c0d",
        subject: "chore: Add new breaking change",
      },
      [
        {
          hash: "0a0b0c0d",
          type: "feat",
          description: "Add new feature",
          subject: "feat: Add new feature",
          body: "This is a body",
          footer: {
            "Acked-by": "Jane Doe",
          },
        },
      ]
    );

    // Pull Request < Commits
    expect(result.errors.length).toBe(1);
  });
});
