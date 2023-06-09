/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import simpleGit from "simple-git";
import * as github from "@actions/github";

/**
 * Commit information
 * @interface ICommit
 * @member hash The commit hash
 * @member message The commit message
 * @member body The commit body
 */
interface ICommit {
  hash: string;
  message: string;
  body: string;
}

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
  octokit: any;

  constructor(octokit: any) {
    this.octokit = octokit;
  }

  public async getCommitMessages(): Promise<ICommit[]> {
    const pullRequestNumber = github.context.payload.pull_request?.number;
    if (!pullRequestNumber) throw new Error("This action only works on pull requests.");

    const commits = await this.octokit.rest.pulls.listCommits({
      ...github.context.repo,
      pull_number: pullRequestNumber,
    });

    const result = commits.data.map((commit: any) => {
      return {
        hash: commit.sha,
        message: commit.commit.message.split("\n")[0],
        body: "", // TODO: Validate commit body
      } as ICommit;
    });

    const { data: pullRequest } = await this.octokit.rest.pulls.get({
      ...github.context.repo,
      pull_number: pullRequestNumber,
    });

    result.push({
      hash: `#${pullRequest.number}`,
      message: pullRequest.title,
      body: pullRequest.body,
    });

    return result;
  }
}

export { ICommit, IDataSource, GitSource, GitHubSource };
