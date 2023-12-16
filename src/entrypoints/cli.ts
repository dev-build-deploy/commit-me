#!/usr/bin/env node

/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import os from "os";

import { Command } from "commander";

import { Configuration } from "../configuration";
import { GitSource } from "../datasources";
import { validateCommits } from "../validator";

const program = new Command();

/**
 * Main entry point for the CLI tool.
 */
program.name("commit-me").description("Conventional Commit message validation");

/**
 * Validate command
 */
program
  .command("check")
  .description("Checks whether your commit messagesare compliant with the Conventional Commit specification.")
  .option("-b, --base-branch <branch>", "The base branch to compare the current branch with.")
  .option("-s, --scopes [scopes...]", "Conventional Commits scopes to validate against.")
  .option("-t, --types [types...]", "Conventional Commits types to validate against.")
  .option("-c, --config <file>", "The configuration file to use.")
  .action(async options => {
    console.log("📄 CommitMe - Conventional Commit compliance validation");
    console.log("-------------------------------------------------------");

    // Set the data source
    const datasource = new GitSource(options.baseBranch ?? "main");

    // Set the global configuration
    const config = await Configuration.getInstance().fromDatasource(datasource, options.config);
    config.addScopes(options.scopes ?? []);
    config.addTypes(options.types ?? []);

    const commits = await datasource.getCommitMessages();

    let errorCount = 0;
    let warningCount = 0;
    const results = validateCommits(commits);

    for (const commit of results) {
      console.log(
        `${commit.errors.length === 0 ? "✅" : "❌"} ${commit.hash}: ${commit.subject.substring(0, 77)}${
          commit.subject.length > 80 ? "..." : ""
        }`
      );

      commit.errors.forEach(err => console.log(err.toString(), os.EOL));
      commit.warnings.forEach(err => console.log(err.toString(), os.EOL));

      errorCount += commit.errors.length;
      warningCount += commit.warnings.length;
    }

    console.log("-------------------------------------------------------");
    if (errorCount === 0) {
      console.log(`✅ All your commits are compliant with Conventional Commit.`);
    } else {
      program.error(`❌ Found ${errorCount} Conventional Commit compliance issues, and ${warningCount} warnings.`);
    }
  });

program.parse(process.argv);
