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
interface IDataSource {
  getCommitMessages(): Promise<ICommit[]>;
}

/**
 * Git data source for determining which commits need to be validated.
 */
class GitSource implements IDataSource {
  sourceBranch: string;

  constructor(baseBranch: string = "main") {
    this.sourceBranch = baseBranch;
  }

  public async getCommitMessages(): Promise<ICommit[]> {
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
class GitHubSource implements IDataSource {
  prTitleOnly: boolean;

  constructor(prTitleOnly: boolean) {
    this.prTitleOnly = prTitleOnly;
  }

  public async getPullRequest(): Promise<ICommit> {
    const octokit = github.getOctokit(core.getInput("token"));
    const pullRequestNumber = github.context.payload.pull_request?.number;
    assert(pullRequestNumber);

    const { data: pullRequest } = await octokit.rest.pulls.get({
      ...github.context.repo,
      pull_number: pullRequestNumber,
    });
    return {
      hash: `#${pullRequest.number}`,
      message: pullRequest.title,
      body: pullRequest.body ?? "", // TODO: Validate pull request body
    };
  }

  public async getCommitMessages(): Promise<ICommit[]> {
    const octokit = github.getOctokit(core.getInput("token"));
    const pullRequestNumber = github.context.payload.pull_request?.number;
    assert(pullRequestNumber);

    const commits = await octokit.rest.pulls.listCommits({
      ...github.context.repo,
      pull_number: pullRequestNumber,
    });

    const result = this.prTitleOnly
      ? []
      : commits.data.map((commit: any) => {
          return {
            hash: commit.sha,
            message: commit.commit.message.split("\n")[0],
            body: "", // TODO: Validate commit body
          };
        });

    return result;
  }
}

export { ICommit, IDataSource, GitSource, GitHubSource };
