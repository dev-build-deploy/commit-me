/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
*/

import { IConventionalCommitOptions } from "@dev-build-deploy/commit-it";

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

  static getInstance() {
    if (!Configuration._instance) {
      Configuration._instance = new Configuration();
    }

    return Configuration._instance;
  }
}

export { Configuration };
