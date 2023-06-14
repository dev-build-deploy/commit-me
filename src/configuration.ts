/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

/**
 * Configuration class
 * @class Configuration
 * @member includeCommits Include commits in the validation process
 * @member includePullRequest Include pull requests in the validation process
 * @member scopes List of scopes to validate against
 * @member types List of types to validate against
 */
class Configuration {
  private static _instance: Configuration;

  includeCommits: boolean;
  includePullRequest: boolean;
  scopes?: string[];
  types?: string[];

  private constructor() {
    this.includeCommits = false;
    this.includePullRequest = false;
  }

  static getInstance() {
    if (!Configuration._instance) {
      Configuration._instance = new Configuration();
    }

    return Configuration._instance;
  }
}

export { Configuration };
