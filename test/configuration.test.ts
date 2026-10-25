/*
 * SPDX-FileCopyrightText: 2024 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as github from "@actions/github";
import { jest } from "@jest/globals";

// ESM: module namespaces are read-only (spying on "@actions/core" fails) and jest.mock() is not hoisted, so the
// data sources are mocked with unstable_mockModule before the modules under test are imported, and the action
// inputs are set the way the runner does: INPUT_<NAME> environment variables.
jest.unstable_mockModule("../src/datasources.js", () => {
  class MockSource {
    async getCommitMessages(): Promise<[]> {
      return [];
    }
    async getConfigurationFile(_path: string): Promise<string | undefined> {
      return undefined;
    }
  }
  return {
    FileSource: class FileSource extends MockSource {
      constructor(_file: string) {
        super();
      }
    },
    GitSource: class GitSource extends MockSource {},
    GitHubSource: class GitHubSource extends MockSource {},
  };
});

const { Configuration } = await import("../src/configuration.js");
const { FileSource, GitHubSource, GitSource } = await import("../src/datasources.js");

/** Sets the GitHub Action inputs (and clears the others) as the runner would. */
function setInputs(inputs: Record<string, string>): void {
  for (const name of ["include-commits", "update-labels", "scopes", "types", "token"]) {
    delete process.env[`INPUT_${name.toUpperCase()}`];
  }
  for (const [name, value] of Object.entries(inputs)) process.env[`INPUT_${name.toUpperCase()}`] = value;
}

describe("FileSource", () => {
  test("No Configuration file", async () => {
    const config = new Configuration();
    await config.fromDatasource(new FileSource(""));

    expect(config.includeCommits).toBe(true);
    expect(config.includePullRequest).toBe(false);
    expect(config.updatePullRequestLabels).toBe(false);
    expect(config.scopes).toStrictEqual([]);
    expect(config.types).toStrictEqual([]);
  });

  test("Configuration file", async () => {
    const config = new Configuration();

    const datasource = new FileSource("");
    // Mock the getConfigurationFile method
    datasource.getConfigurationFile = jest.fn<() => Promise<string | undefined>>().mockResolvedValue(`{
      "includeCommits": false,
      "includePullRequest": true,
      "updatePullRequestLabels": true,
      "scopes": ["test-scope"],
      "types": ["test-type"]
    }`);
    await config.fromDatasource(datasource, "configuration.json");

    // These will be ignored as they only apply for GitHub Actions
    expect(config.includeCommits).toBe(true);
    expect(config.includePullRequest).toBe(false);
    expect(config.updatePullRequestLabels).toBe(false);

    // These will be set
    expect(config.scopes).toStrictEqual(["test-scope"]);
    expect(config.types).toStrictEqual(["test-type"]);
  });
});

describe("GitSource", () => {
  test("No Configuration file", async () => {
    const config = new Configuration();
    await config.fromDatasource(new GitSource());

    expect(config.includeCommits).toBe(true);
    expect(config.includePullRequest).toBe(false);
    expect(config.updatePullRequestLabels).toBe(false);
    expect(config.scopes).toStrictEqual([]);
    expect(config.types).toStrictEqual([]);
  });

  test("Configuration file", async () => {
    const config = new Configuration();

    const datasource = new GitSource();
    // Mock the getConfigurationFile method
    datasource.getConfigurationFile = jest.fn<() => Promise<string | undefined>>().mockResolvedValue(`{
      "githubAction": {
        "includeCommits": false,
        "includePullRequest": true,
        "updatePullRequestLabels": true
      },
      "scopes": ["test-scope"],
      "types": ["test-type"]
    }`);
    await config.fromDatasource(datasource, "configuration.json");

    // These will be ignored as they only apply for GitHub Actions
    expect(config.includeCommits).toBe(true);
    expect(config.includePullRequest).toBe(false);
    expect(config.updatePullRequestLabels).toBe(false);

    // These will be set
    expect(config.scopes).toStrictEqual(["test-scope"]);
    expect(config.types).toStrictEqual(["test-type"]);
  });
});

describe("GitHubSource", () => {
  test("Auto Detect: No merge strategy configuration", async () => {
    // Disable the GitHub Action inputs
    setInputs({});

    // Set the payload
    github.context.payload.pull_request = { number: 1, base: { repo: {} } };

    const config = new Configuration();
    await expect(config.fromDatasource(new GitHubSource())).rejects.toThrow();
  });

  test("Auto Detect: allow rebase merge", async () => {
    // Disable the GitHub Action inputs
    setInputs({});

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: true } },
    };

    const config = new Configuration();
    await config.fromDatasource(new GitHubSource());

    expect(config.includeCommits).toBe(true);
  });

  test("Auto Detect: disallow rebase merge", async () => {
    // Disable the GitHub Action inputs
    setInputs({});

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: false } },
    };

    const config = new Configuration();
    await config.fromDatasource(new GitHubSource());

    expect(config.includeCommits).toBe(false);
  });

  test("Configuration file only", async () => {
    // Disable the GitHub Action inputs
    setInputs({});

    const datasource = new GitHubSource();
    datasource.getConfigurationFile = jest.fn<() => Promise<string | undefined>>().mockResolvedValue(`{
      "githubAction": {
        "includeCommits": true,
        "includePullRequest": true,
        "updatePullRequestLabels": true
      },
      "scopes": ["test-scope"],
      "types": ["test-type"]
    }`);

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: false } },
    };

    const config = new Configuration();
    await config.fromDatasource(datasource, "configuration.json");

    // GitHub Actions configuration items
    expect(config.includeCommits).toBe(true);
    expect(config.includePullRequest).toBe(true);
    expect(config.updatePullRequestLabels).toBe(true);

    // Generic configuration items
    expect(config.scopes).toStrictEqual(["test-scope"]);
    expect(config.types).toStrictEqual(["test-type"]);
  });

  test("Inputs only", async () => {
    setInputs({ "include-commits": "true", "update-labels": "true", scopes: "test-scope", types: "test-type" });

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: false } },
    };

    const config = new Configuration();
    await config.fromDatasource(new GitHubSource());

    // GitHub Actions configuration items
    expect(config.includeCommits).toBe(true);
    expect(config.includePullRequest).toBe(true);
    expect(config.updatePullRequestLabels).toBe(true);

    // Generic configuration items
    expect(config.scopes).toStrictEqual(["test-scope"]);
    expect(config.types).toStrictEqual(["test-type"]);
  });

  test("Inputs and Configuration", async () => {
    setInputs({ "include-commits": "false", "update-labels": "false", scopes: "test-scope", types: "test-type" });

    const datasource = new GitHubSource();
    datasource.getConfigurationFile = jest.fn<() => Promise<string | undefined>>().mockResolvedValue(`{
      "githubAction": {
        "includeCommits": true,
        "includePullRequest": true,
        "updatePullRequestLabels": true
      },
      "scopes": ["wrong-scope"],
      "types": ["wrong-type"]
    }`);

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: false } },
    };

    const config = new Configuration();
    await config.fromDatasource(datasource);

    // GitHub Actions configuration items
    expect(config.includeCommits).toBe(false);
    expect(config.includePullRequest).toBe(true);
    expect(config.updatePullRequestLabels).toBe(false);

    // Generic configuration items
    expect(config.scopes).toStrictEqual(["test-scope"]);
    expect(config.types).toStrictEqual(["test-type"]);
  });
});
