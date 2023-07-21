/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import * as core from "@actions/core";
import * as github from "@actions/github";
import * as repository from "../repository";
import { GitHubSource } from "../datasources";
import { IValidationResult, validateCommits, validatePullRequest } from "../validator";
import { updatePullRequestLabels } from "../github";
import { isConventionalCommit, ICommit, IConventionalCommit } from "@dev-build-deploy/commit-it";
import assert from "assert";
import { Configuration } from "../configuration";

/**
 * Determines the label to be applied to the pull request.
 * @param commits The validated commits to determine the label from
 * @returns The label to be applied to the pull request ("breaking", "feature", "fix" or undefined)
 */
const determineLabel = async (commits: IValidationResult[]): Promise<"breaking" | "feature" | "fix" | undefined> => {
  let type: "breaking" | "feature" | "fix" | undefined;

  for (const commit of commits) {
    if (!isConventionalCommit(commit.commit)) continue;

    const convCommit = commit.commit as IConventionalCommit;
    if (convCommit.breaking) return "breaking";
    if (convCommit.type === "feat") type = "feature";
    else if (convCommit.type === "fix" && type !== "feature") type = "fix";
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
    core.info(`${commit.errors.length === 0 ? "✅" : "❌"} ${commit.commit.hash}: ${commit.commit.subject}`);
    commit.errors.forEach(error => core.error(error, { title: "Conventional Commit Compliance" }));
    errorCount += commit.errors.length;
  }
  return errorCount;
};

const setConfiguration = () => {
  assert(github.context.payload.pull_request);

  const pullrequestOnly = core.getInput("include-commits")
    ? !core.getBooleanInput("include-commits")
    : github.context.payload.pull_request.base.repo.allow_rebase_merge === false;

  // Set the global configuration
  const config = Configuration.getInstance();
  config.includeCommits = !pullrequestOnly;
  config.includePullRequest = true;
  config.scopes = core.getMultilineInput("scopes") ?? [];
  config.types = core.getMultilineInput("types") ?? [];
};

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 CommitMe - Conventional Commit compliance validation");
    setConfiguration();

    core.startGroup("📝 Checking repository configuration");
    const datasource = new GitHubSource();
    const config = Configuration.getInstance();
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

    if (core.getInput("include-commits") === undefined) {
      repository.checkConfiguration(github.context.payload.pull_request.base.repo);
    } else {
      core.info(
        config.includeCommits === true
          ? "ℹ️ Validating both Pull Request title and all associated commits."
          : "ℹ️ Only validating the Pull Request title."
      );
    }

    // Setting up the environment
    const commits = config.includeCommits ? await datasource.getCommitMessages() : [];
    core.endGroup();

    // Gathering commit message information
    const resultCommits = validateCommits(commits);

    let errorCount = 0;
    const allResults: IValidationResult[] = [...resultCommits];

    if (config.includePullRequest === true) {
      core.startGroup(`🔎 Scanning Pull Request`);
      const resultPullrequest = validatePullRequest(
        {
          hash: `#${github.context.payload.pull_request.number}`,
          subject: github.context.payload.pull_request.title,
          body: github.context.payload.pull_request.body ?? "",
        } as ICommit,
        resultCommits.map(commit => commit.commit as IConventionalCommit).filter(commit => commit !== undefined)
      );
      allResults.push(resultPullrequest);
      errorCount += reportErrorMessages([resultPullrequest]);
      core.endGroup();
    }

    if (config.includeCommits === true) {
      core.startGroup("🔎 Scanning Commits associated with Pull Request");
      errorCount += reportErrorMessages(resultCommits);
      core.endGroup();
    }

    if (errorCount > 0) {
      core.setFailed(`❌ Found ${errorCount} Conventional Commits compliance issues.`);
      return;
    }

    // Updating the pull request label
    if (githubToken === undefined) {
      core.warning("⚠️ The token input is required to update the pull request label.");
    } else if (core.getBooleanInput("update-labels") === true) {
      const label = await determineLabel(allResults);
      if (label !== undefined) await updatePullRequestLabels(label);
    }

    core.info(`✅ Your Pull Request is compliant with Conventional Commits.`);
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
