/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import { IConventionalCommitOptions } from "@dev-build-deploy/commit-it";

import { FileSource, GitHubSource, GitSource, IDataSource } from "./datasources";

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
    if (!content) return this;

    if (datasource instanceof GitSource || datasource instanceof FileSource) {
      this.includeCommits = true;
      this.includePullRequest = false;
    } else if (datasource instanceof GitHubSource) {
      this.includePullRequest = true;
    } else {
      throw new Error("Unsupported data source");
    }

    const config = JSON.parse(content);
    this.includeCommits = config.includeCommits ?? this.includeCommits;
    this.includePullRequest = config.includePullRequest ?? this.includePullRequest;
    this.addScopes(config.scopes ?? []);
    this.addTypes(config.types ?? []);

    return this;
  }
}

export { Configuration };
