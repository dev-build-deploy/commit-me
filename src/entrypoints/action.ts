/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as core from "@actions/core";
import * as github from "@actions/github";
import { GitHubSource } from "../datasources";
import { RequirementError, parse } from "../conventional_commit";

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 CommitMe - Conventional Commit compliance validation");

    if (github.context.eventName !== "pull_request") throw new Error("This action only works on pull requests.");

    // Setting up the environment
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const datasource = new GitHubSource(octokit);

    // Gathering commit message information
    core.startGroup("🔎 Scanning Pull Request");
    const commits = await datasource.getCommitMessages();
    commits.forEach(commit =>
      core.info(`📄 ${commit.hash}: ${commit.message.substring(0, 77)}${commit.message.length > 80 ? "..." : ""}`)
    );
    core.endGroup();

    const errors: string[] = [];
    try {
      commits.forEach(commit => {
        try {
          parse(commit);
          core.info(`✅ ${commit.hash}`);
        } catch (error) {
          core.startGroup(`❌ ${commit.hash}`);
          if (Array.isArray(error)) {
            error
              .filter(e => e instanceof RequirementError)
              .forEach(e => {
                core.error(`❌ ${e.message}`);
                errors.push(e.message);
              });
          }
          core.endGroup();
        }
      });
    } catch (error) {
      core.error(`${error}`);
    }
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
