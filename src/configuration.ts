/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */
import assert from "assert";

import * as core from "@actions/core";
import * as github from "@actions/github";
import { IConventionalCommitOptions } from "@dev-build-deploy/commit-it";

import { FileSource, GitHubSource, GitSource, IDataSource } from "./datasources";
import * as repository from "./repository";

/**
 * Configuration class
 * @class Configuration
 * @member includeCommits Include commits in the validation process
 * @member includePullRequest Include pull requests in the validation process
 * @member scopes List of scopes to validate against
 * @member types List of types to validate against
 */
class Configuration implements IConventionalCommitOptions {
  private static _instance: Configuration;

  includeCommits = false;
  includePullRequest = false;
  updatePullRequestLabels = false;
  scopes?: string[];
  types?: string[];

  static getInstance(): Configuration {
    if (!Configuration._instance) {
      Configuration._instance = new Configuration();
    }

    return Configuration._instance;
  }

  /**
   * Extends the list of types to validate against.
   * @param types List of types to validate against
   */
  addTypes(types: string | string[]): void {
    const typesList = Array.isArray(types) ? types : [types];
    const valid = typesList.every(item => typeof item === "string");
    if (!valid) throw new Error("Invalid data provided for 'types', expected string or array of strings");
    this.types = this.types ? [...this.types, ...typesList] : typesList;
  }

  /**
   * Extends the list of scopes to validate against.
   * @param scopes List of scopes to validate against
   */
  addScopes(scopes: string | string[]): void {
    const scopesList = Array.isArray(scopes) ? scopes : [scopes];
    const valid = scopesList.every(item => typeof item === "string");
    if (!valid) throw new Error("Invalid data provided for 'scopes', expected string or array of strings");
    this.scopes = this.scopes ? [...this.scopes, ...scopesList] : scopesList;
  }

  /**
   * Loads the configuration from a JSON5 file.
   * @param file The file to load the configuration from
   */
  async fromDatasource(datasource: IDataSource, configPath?: string): Promise<this> {
    const content = await datasource.getConfigurationFile(configPath ?? ".commit-me.json");
    const config = content ? JSON.parse(content) : {};

    if (datasource instanceof GitSource || datasource instanceof FileSource) {
      this.includeCommits = true;
      this.includePullRequest = false;
      this.updatePullRequestLabels = false;

      this.addScopes(config.scopes ?? []);
      this.addTypes(config.types ?? []);
    } else if (datasource instanceof GitHubSource) {
      const hasIncludeCommitsInput = core.getInput("include-commits") !== "";
      const hasIncludePullRequestInput = core.getInput("include-pull-request") !== "";
      const hasPullRequestLabelsInput = core.getInput("update-labels") !== "";

      const autoDetectIncludeCommits = !hasIncludeCommitsInput && config.githubAction?.includeCommits === undefined;
      const autoDetectIncludePR = !hasIncludePullRequestInput && config.githubAction?.includePullRequest === undefined;

      if (autoDetectIncludeCommits) {
        assert(github.context.payload.pull_request);
        repository.checkConfiguration(github.context.payload.pull_request.base.repo);
        this.includeCommits = github.context.payload.pull_request.base.repo.allow_rebase_merge === true;
      } else {
        this.includeCommits = hasIncludeCommitsInput
          ? core.getBooleanInput("include-commits")
          : config.githubAction?.includeCommits ?? false;
      }

      if (autoDetectIncludePR) {
        assert(github.context.payload.pull_request);
        this.includePullRequest = github.context.payload.pull_request.base.repo.allow_rebase_merge === true;
      } else {
        this.includePullRequest = hasIncludePullRequestInput
          ? core.getBooleanInput("include-pull-request")
          : config.githubAction?.includePullRequest ?? true;
      }

      if (core.getMultilineInput("scopes").length > 0) {
        this.addScopes(core.getMultilineInput("scopes"));
      } else {
        this.addScopes(config.scopes ?? []);
      }

      if (core.getMultilineInput("types").length > 0) {
        this.addTypes(core.getMultilineInput("types"));
      } else {
        this.addTypes(config.types ?? []);
      }

      this.updatePullRequestLabels = hasPullRequestLabelsInput
        ? core.getBooleanInput("update-labels")
        : config.githubAction?.updatePullRequestLabels ?? false;
    } else {
      throw new Error("Unsupported data source");
    }

    return this;
  }
}

export { Configuration };
