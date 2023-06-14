/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import simpleGit from "simple-git";
import * as github from "@actions/github";
import * as core from "@actions/core";
import assert from "assert";
import { ICommit } from "./conventional_commit";

/** DataSource abstraction interface
 * @interface IDataSource
 * @member getCommitMessages Returns a list of commits to be validated
 */
export interface IDataSource {
  getCommitMessages(): Promise<ICommit[]>;
}

/**
 * Git data source for determining which commits need to be validated.
 */
export class GitSource implements IDataSource {
  sourceBranch: string;

  constructor(baseBranch = "main") {
    this.sourceBranch = baseBranch;
  }

  async getCommitMessages(): Promise<ICommit[]> {
    const data = await simpleGit().log({
      from: this.sourceBranch,
      to: "HEAD",
    });

    return data.all.map((commit: any) => {
      return {
        hash: commit.hash,
        message: commit.message,
        body: commit.body,
      } as ICommit;
    });
  }
}

/**
 * GitHub data source for determining which commits need to be validated.
 */
export class GitHubSource implements IDataSource {
  async getCommitMessages(): Promise<ICommit[]> {
    const octokit = github.getOctokit(core.getInput("token"));
    const pullRequestNumber = github.context.payload.pull_request?.number;
    assert(pullRequestNumber);

    const commits = await octokit.rest.pulls.listCommits({
      ...github.context.repo,
      pull_number: pullRequestNumber,
    });

    return commits.data.map((commit: any) => {
      return {
        hash: commit.sha,
        message: commit.commit.message.split("\n")[0],
        body: commit.commit.message.split("\n").slice(2).join("\n"),
      };
    });
  }
}
