/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as repository from "../repository";
import { GitHubSource } from "../datasources";
import { IValidationResult, validateCommits, validatePullRequest } from "../validator";
import { updatePullRequestLabels } from "../github";
import { IConventionalCommit } from "../conventional_commit";

/**
 * Determines the label to be applied to the pull request.
 * @param commits The validated commits to determine the label from
 * @returns The label to be applied to the pull request ("breaking", "feature", "fix" or undefined)
 */
const determineLabel = async (commits: IValidationResult[]): Promise<"breaking" | "feature" | "fix" | undefined> => {
  let type: "breaking" | "feature" | "fix" | undefined;

  for (const commit of commits) {
    if (commit.conventionalCommit?.breaking) return "breaking";
    if (commit.conventionalCommit?.type === "feat") type = "feature";
    else if (commit.conventionalCommit?.type === "fix" && type !== "feature") type = "fix";
  }

  return type;
};

/**
 * Reports the error messages to the GitHub Action log.
 * @param results The validation results to report
 * @returns The total number of errors reported
 */
const reportErrorMessages = (results: IValidationResult[]) => {
  let errorCount = 0;

  for (const commit of results) {
    core.info(
      `${commit.errors.length === 0 ? "✅" : "❌"} ${commit.commit.hash}: ${commit.commit.message.substring(0, 77)}${
        commit.commit.message.length > 80 ? "..." : ""
      }`
    );
    commit.errors.forEach(error => core.error(error, { title: "Conventional Commit Compliance" }));
    errorCount += commit.errors.length;
  }
  return errorCount;
};

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 CommitMe - Conventional Commit compliance validation");

    core.startGroup("📝 Checking repository configuration");

    if (!["pull_request", "pull_request_target"].includes(github.context.eventName)) {
      core.setFailed("❌ This action only works on pull requests.");
      return;
    }

    let pullrequestOnly = core.getInput("include-commits") ? core.getBooleanInput("include-commits") : undefined;

    if (pullrequestOnly === undefined) {
      await repository.checkConfiguration();
      pullrequestOnly = await repository.hasRebaseMerge();
    } else {
      core.info(
        pullrequestOnly === false
          ? "ℹ️ Validating both Pull Request title and all associated commits."
          : "ℹ️ Only validating the Pull Request title."
      );
    }

    // Setting up the environment
    const datasource = new GitHubSource(!pullrequestOnly);
    const commits = await datasource.getCommitMessages();
    core.endGroup();

    // Gathering commit message information
    const pullrequest = await datasource.getPullRequest();
    const resultCommits = pullrequestOnly ? validateCommits(commits) : [];
    const resultPullrequest = validatePullRequest(
      pullrequest,
      resultCommits
        .map(commit => commit.conventionalCommit as IConventionalCommit)
        .filter(commit => commit !== undefined)
    );

    core.startGroup(`🔎 Scanning Pull Request`);
    let errorCount = reportErrorMessages([resultPullrequest]);
    core.endGroup();

    if (pullrequestOnly) {
      core.startGroup("🔎 Scanning Commits associated with Pull Request");
      errorCount += reportErrorMessages(resultCommits);
      core.endGroup();
    }

    if (errorCount > 0) {
      core.setFailed(`❌ Found ${errorCount} Conventional Commits compliance issues.`);
      return;
    }

    // Updating the pull request label
    if (core.getBooleanInput("update-labels") === true) {
      const label = await determineLabel([resultPullrequest, ...resultCommits]);
      if (label !== undefined) await updatePullRequestLabels(label);
    }

    core.info(`✅ Your Pull Request is compliant with Conventional Commits.`);
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
