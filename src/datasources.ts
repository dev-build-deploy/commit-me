/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import assert from "assert";
import * as fs from "fs";

import * as core from "@actions/core";
import * as github from "@actions/github";
import { RequestError } from "@octokit/request-error";
import { Commit } from "@dev-build-deploy/commit-it";
import { simpleGit } from "simple-git";

/** DataSource abstraction interface
 * @interface IDataSource
 * @member getCommitMessages Returns a list of commits to be validated
 */
export interface IDataSource {
  getCommitMessages(): Promise<Commit[]>;
  getConfigurationFile(path: string): Promise<string | undefined>;
}

/**
 * File data source for parsing a file containing the commit message.
 */
export class FileSource implements IDataSource {
  file: string;

  constructor(file: string) {
    this.file = file;

    if (!fs.existsSync(this.file)) {
      throw new Error(`File ${this.file} does not exist`);
    }
  }

  async getCommitMessages(): Promise<Commit[]> {
    return [Commit.fromString({ hash: "HEAD", message: fs.readFileSync(this.file, "utf8") })];
  }

  async getConfigurationFile(path: string): Promise<string | undefined> {
    if (!fs.existsSync(path)) {
      return undefined;
    }

    return fs.readFileSync(path, "utf8");
  }
}

/**
 * Git data source for determining which commits need to be validated.
 */
export class GitSource implements IDataSource {
  sourceBranch: string;

  constructor(baseBranch = "main") {
    this.sourceBranch = baseBranch;
  }

  async getCommitMessages(): Promise<Commit[]> {
    const data = await simpleGit().log({ from: this.sourceBranch, to: "@{push}" });
    return data.all.map(commit => Commit.fromHash({ hash: commit.hash }));
  }

  async getConfigurationFile(path: string): Promise<string | undefined> {
    if (!fs.existsSync(path)) {
      return undefined;
    }

    return fs.readFileSync(path, "utf8");
  }
}

/**
 * GitHub data source for determining which commits need to be validated.
 */
export class GitHubSource implements IDataSource {
  async getCommitMessages(): Promise<Commit[]> {
    const octokit = github.getOctokit(core.getInput("token"));
    const pullRequestNumber = github.context.payload.pull_request?.number;
    assert(pullRequestNumber);

    const commits = await octokit.rest.pulls.listCommits({ ...github.context.repo, pull_number: pullRequestNumber });

    return commits.data.map(commit =>
      Commit.fromString({
        hash: commit.sha,
        message: commit.commit.message,
      })
    );
  }

  /**
   * Retrieves the specified configuration file from the repository using the REST API
   * @param path
   */
  async getConfigurationFile(path: string): Promise<string | undefined> {
    const octokit = github.getOctokit(core.getInput("token"));

    try {
      const { data: config } = await octokit.rest.repos.getContent({
        ...github.context.repo,
        path,
        ref: github.context.ref,
      });

      if ("content" in config === false) {
        throw new Error("Unsupported metadata type for Configuration path");
      }

      return Buffer.from(config.content, "base64").toString();
    } catch (error: unknown) {
      if (error instanceof RequestError && error.response) {
        const reponseData = error.response.data as Record<string, unknown>;
        if ("message" in reponseData && reponseData.message === "Not Found") {
          return undefined;
        }
      }
      throw error;
    }
  }
}
