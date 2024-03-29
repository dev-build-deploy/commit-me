#!/usr/bin/env node

/*
 * SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import os from "os";

import { Command } from "commander";

import { Configuration } from "../configuration";
import { FileSource } from "../datasources";
import { validateCommits } from "../validator";

const program = new Command();

/**
 * Main entry point for the CLI tool.
 */
program
  .name("pre-commit-me")
  .description("Conventional Commit message validation (pre-commit hook)")
  .option("-c, --config <file>", "The configuration file to use.")
  .argument("<file>", "The file containing the commit messages to validate.")
  .action(async file => {
    // Set the global configuration
    const datasource = new FileSource(file);
    await Configuration.getInstance().fromDatasource(datasource, program.opts().config);

    const commits = await datasource.getCommitMessages();

    let errorCount = 0;
    let warningCount = 0;

    validateCommits(commits).forEach(commit => {
      commit.errors.forEach(err => console.log(err.toString(), os.EOL));
      commit.warnings.forEach(err => console.log(err.toString(), os.EOL));

      errorCount += commit.errors.length;
      warningCount += commit.warnings.length;
    });

    if (errorCount > 0) {
      program.error(`❌ Found ${errorCount} Conventional Commit compliance issues, and ${warningCount} warnings.`);
    }
  });

program.parse(process.argv);
