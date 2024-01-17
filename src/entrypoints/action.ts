/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import assert from "assert";

import * as core from "@actions/core";
import * as github from "@actions/github";
import { Commit, ConventionalCommit } from "@dev-build-deploy/commit-it";

import { Configuration } from "../configuration";
import { GitHubSource } from "../datasources";
import { updatePullRequestLabels } from "../github";
import { validateCommits, validatePullRequest } from "../validator";

/**
 * Determines the label to be applied to the pull request.
 * @param commits The validated commits to determine the label from
 * @returns The label to be applied to the pull request ("breaking", "feature", "fix" or undefined)
 */
const determineLabel = async (commits: ConventionalCommit[]): Promise<"breaking" | "feature" | "fix" | undefined> => {
  let type: "breaking" | "feature" | "fix" | undefined;

  for (const commit of commits) {
    if (!commit.isValid) continue;

    if (commit.breaking) return "breaking";
    if (commit.type?.toLowerCase() === "feat") type = "feature";
    else if (commit.type?.toLowerCase() === "fix" && type !== "feature") type = "fix";
  }

  return type;
};

/**
 * Reports the error messages to the GitHub Action log.
 * @param results The validation results to report
 * @returns The total number of errors reported
 */
const reportErrorMessages = (results: ConventionalCommit[]): { errors: number; warnings: number } => {
  let errorCount = 0;
  let warningCount = 0;

  for (const commit of results) {
    core.info(`${commit.errors.length === 0 ? "✅" : "❌"} ${commit.hash}: ${commit.subject}`);
    commit.errors.forEach(error => core.error(error.toString(), { title: "Conventional Commit Compliance" }));
    errorCount += commit.errors.length;

    commit.warnings.forEach(warning => core.warning(warning.toString(), { title: "Conventional Commit Compliance" }));
    warningCount += commit.warnings.length;
  }

  return { errors: errorCount, warnings: warningCount };
};

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 CommitMe - Conventional Commit compliance validation");

    core.startGroup("📝 Checking repository configuration");
    const datasource = new GitHubSource();
    const config = await Configuration.getInstance().fromDatasource(datasource, core.getInput("config") || undefined);

    const githubToken = core.getInput("token") ?? undefined;

    assert(github.context.payload.pull_request);

    if (!["pull_request", "pull_request_target"].includes(github.context.eventName)) {
      core.setFailed("❌ This action only works on pull requests.");
      return;
    }

    if (githubToken === undefined && config.includeCommits === true) {
      core.setFailed("❌ The `token` input is required for the current configuration of CommitMe.");
      return;
    }

    if (config.includeCommits === true) {
      if (config.includePullRequest === true) {
        core.info("ℹ️ Validating both Pull Request and all associated commits.");
      } else {
        core.info("ℹ️ Only validating the commits associated with the Pull Request.");
      }
    } else {
      if (config.includePullRequest === true) {
        core.info("ℹ️ Only validating the Pull Request.");
      } else {
        core.setFailed(
          "❌ The current configuration of CommitMe does not validate either Pull Request or the associated commits."
        );
      }
    }

    // Setting up the environment
    const commits = config.includeCommits ? await datasource.getCommitMessages() : [];
    core.endGroup();

    // Gathering commit message information
    const resultCommits = validateCommits(commits);

    let errorCount = 0;
    let warningCount = 0;
    const allResults: ConventionalCommit[] = [...resultCommits];

    if (config.includePullRequest === true) {
      core.startGroup(`🔎 Scanning Pull Request`);
      const resultPullrequest = validatePullRequest(
        Commit.fromString({
          hash: `#${github.context.payload.pull_request.number}`,
          message: [github.context.payload.pull_request.title, "", github.context.payload.pull_request.body].join("\n"),
        }),
        allResults
      );
      allResults.push(resultPullrequest);
      const counts = reportErrorMessages([resultPullrequest]);
      errorCount += counts.errors;
      warningCount += counts.warnings;

      core.endGroup();
    }

    if (config.includeCommits === true) {
      core.startGroup("🔎 Scanning Commits associated with Pull Request");
      const counts = reportErrorMessages(resultCommits);
      errorCount += counts.errors;
      warningCount += counts.warnings;

      core.endGroup();
    }

    if (errorCount > 0) {
      core.setFailed(`❌ Found ${errorCount} Conventional Commit compliance issues, and ${warningCount} warnings.`);
      return;
    } else if (warningCount > 0) {
      core.warning(`⚠️ Found ${warningCount} Conventional Commit compliance warnings.`);
    }

    // Updating the pull request label
    if (githubToken === undefined) {
      core.warning("⚠️ The token input is required to update the pull request label.");
    } else if (config.updatePullRequestLabels === true) {
      const label = await determineLabel(allResults);
      if (label !== undefined) await updatePullRequestLabels(label);
    }

    core.info(`✅ Your Pull Request is compliant with Conventional Commits.`);
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
