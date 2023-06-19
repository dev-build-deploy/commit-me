/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import simpleGit from "simple-git";
import * as github from "@actions/github";
import * as core from "@actions/core";
import assert from "assert";
import { ICommit, getCommit } from "@dev-build-deploy/commit-it";

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
    const data = await simpleGit().log({ from: this.sourceBranch, to: "HEAD" });
    return data.all.map(commit => getCommit({ hash: commit.hash }));
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

    const commits = await octokit.rest.pulls.listCommits({ ...github.context.repo, pull_number: pullRequestNumber });

    return commits.data.map(commit => {
      return {
        hash: commit.sha,
        subject: commit.commit.message.split("\n")[0],
        body: commit.commit.message.split("\n").slice(2).join("\n"),
      };
    });
  }
}
