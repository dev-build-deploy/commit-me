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
 * @member date The commit date
 * @member message The commit message
 * @member body The commit body
 * @member author The commit author name (.name) and email (.email)
 */
interface ICommit {
  hash: string;
  date: string;
  message: string;
  body: string;
  author: { name: string; email: string };
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
        date: commit.date,
        message: commit.message,
        body: commit.body,
        author: {
          name: commit.author_name,
          email: commit.author_email,
        },
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
    const commits = await this.octokit.rest.pulls.listCommits({
      ...github.context.repo,
      pull_number: github.context.payload.pull_request?.number ?? 0,
    });
    return commits.data.map((commit: any) => {
      return {
        hash: commit.sha,
        date: commit.commit.author.date,
        message: commit.commit.message.split("\n")[0],
        body: "", // TODO: Validate commit body
        author: {
          name: commit.author.name,
          email: commit.author.email,
        },
      } as ICommit;
    });
  }
}

export { ICommit, IDataSource, GitSource, GitHubSource };
