/*
 * SPDX-FileCopyrightText: 2024 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as core from "@actions/core";
import * as github from "@actions/github";

import { Configuration } from "../src/configuration";
import { FileSource, GitHubSource, GitSource } from "../src/datasources";

jest.mock("../src/datasources");

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
    datasource.getConfigurationFile = jest.fn().mockResolvedValue(`{
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
    datasource.getConfigurationFile = jest.fn().mockResolvedValue(`{
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
    jest.spyOn(core, "getInput").mockReturnValue("");
    jest.spyOn(core, "getBooleanInput").mockReturnValue(false);

    // Set the payload
    github.context.payload.pull_request = { number: 1, base: { repo: {} } };

    const config = new Configuration();
    await expect(config.fromDatasource(new GitHubSource())).rejects.toThrow();
  });

  test("Auto Detect: allow rebase merge", async () => {
    // Disable the GitHub Action inputs
    jest.spyOn(core, "getInput").mockReturnValue("");
    jest.spyOn(core, "getBooleanInput").mockReturnValue(false);

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: true } },
    };

    const config = new Configuration();
    await config.fromDatasource(new GitHubSource());

    expect(config.includeCommits).toBe(true);
    expect(config.includePullRequest).toBe(true);
  });

  test("Auto Detect: disallow rebase merge", async () => {
    // Disable the GitHub Action inputs
    jest.spyOn(core, "getInput").mockReturnValue("");
    jest.spyOn(core, "getBooleanInput").mockReturnValue(false);

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: false } },
    };

    const config = new Configuration();
    await config.fromDatasource(new GitHubSource());

    expect(config.includeCommits).toBe(false);
    expect(config.includePullRequest).toBe(false);
  });

  test("Configuration file only", async () => {
    // Disable the GitHub Action inputs
    jest.spyOn(core, "getInput").mockReturnValue("");
    jest.spyOn(core, "getBooleanInput").mockReturnValue(false);

    const datasource = new GitHubSource();
    datasource.getConfigurationFile = jest.fn().mockResolvedValue(`{
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
    jest.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "include-commits") return "true";
      if (name === "include-pull-request") return "true";
      if (name === "update-labels") return "true";
      return "";
    });

    jest.spyOn(core, "getBooleanInput").mockImplementation((name: string) => {
      if (name === "include-commits") return true;
      if (name === "include-pull-request") return true;
      if (name === "update-labels") return true;
      return false;
    });

    jest.spyOn(core, "getMultilineInput").mockImplementation((name: string) => {
      if (name === "scopes") return ["test-scope"];
      if (name === "types") return ["test-type"];
      return [];
    });

    // Set the payload
    github.context.payload.pull_request = {
      number: 1,
      base: { repo: { allow_merge_commit: false, allow_squash_merge: false, allow_rebase_merge: false } },
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
    jest.spyOn(core, "getInput").mockImplementation((name: string) => {
      if (name === "include-commits") return "false";
      if (name === "include-pull-request") return "false";
      if (name === "update-labels") return "false";
      return "";
    });

    jest.spyOn(core, "getBooleanInput").mockImplementation((name: string) => {
      if (name === "include-commits") return false;
      if (name === "include-pull-request") return false;
      if (name === "update-labels") return false;
      return false;
    });

    jest.spyOn(core, "getMultilineInput").mockImplementation((name: string) => {
      if (name === "scopes") return ["test-scope"];
      if (name === "types") return ["test-type"];
      return [];
    });

    const datasource = new GitHubSource();
    datasource.getConfigurationFile = jest.fn().mockResolvedValue(`{
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
      base: { repo: { allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: true } },
    };

    const config = new Configuration();
    await config.fromDatasource(datasource);

    // GitHub Actions configuration items
    expect(config.includeCommits).toBe(false);
    expect(config.includePullRequest).toBe(false);
    expect(config.updatePullRequestLabels).toBe(false);

    // Generic configuration items
    expect(config.scopes).toStrictEqual(["test-scope"]);
    expect(config.types).toStrictEqual(["test-type"]);
  });
});
