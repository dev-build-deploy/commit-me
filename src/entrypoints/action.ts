/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as core from "@actions/core";
import * as github from "@actions/github";
import { GitHubSource } from "../datasources";
import { validate } from "../validator";

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 CommitMe - Conventional Commit compliance validation");

    if (github.context.eventName !== "pull_request") {
      core.setFailed("❌ This action only works on pull requests.");
      return;
    }

    // Setting up the environment
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const datasource = new GitHubSource(octokit);

    core.startGroup("🔎 Scanning Pull Request");
    let errorCount = 0;

    // Gathering commit message information
    const commits = await datasource.getCommitMessages();
    const results = validate(commits);

    // Outputting validation results
    for (const commit of results) {
      core.info(
        `${commit.errors.length === 0 ? "✅" : "❌"} ${commit.commit.hash}: ${commit.commit.message.substring(0, 77)}${
          commit.commit.message.length > 80 ? "..." : ""
        }`
      );
      commit.errors.forEach(error => core.error(error, { title: "Conventional Commit Compliance" }));
      errorCount += commit.errors.length;
    }
    core.endGroup();

    if (errorCount === 0) {
      core.info(`✅ All your commits are compliant with Conventional Commit.`);
    } else {
      core.setFailed(`❌ Found ${errorCount} Conventional Commit compliance issues.`);
    }
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
