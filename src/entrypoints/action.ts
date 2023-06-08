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
    core.info("-------------------------------------------------------");

    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const datasource = new GitHubSource(octokit);
    const commits = await datasource.getCommitMessages();

    const errors: string[] = [];
    try {
      commits.forEach(commit => {
        try {
          parse(commit);
          core.info(`✅ ${commit.hash}`);
        } catch (error) {
          core.startGroup(`❌ ${commit.hash}`)
          if (Array.isArray(error)) {
            error.filter(e => e instanceof RequirementError).forEach(e => {
              core.error(`❌ ${e.message}`)
              errors.push(e.message)
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
