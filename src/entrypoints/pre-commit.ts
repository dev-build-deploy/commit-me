#!/usr/bin/env node

/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Command } from "commander";
import { FileSource } from "../datasources";
import { validateCommits } from "../validator";
import { Configuration } from "../configuration";

const program = new Command();

/**
 * Main entry point for the CLI tool.
 */
program
  .name("pre-commit-me")
  .description("Conventional Commit message validation (pre-commit hook)")
  .argument("<file>", "The file containing the commit messages to validate.")
  .action(async file => {
    // Set the global configuration
    const config = Configuration.getInstance();
    config.includeCommits = true;

    const commits = await new FileSource(file).getCommitMessages();

    let errorCount = 0;
    validateCommits(commits).forEach(commit => {
      commit.errors.forEach(error => console.log(error));
      errorCount += commit.errors.length;
    });

    if (errorCount > 0) {
      program.error(`❌ Found ${errorCount} Conventional Commit compliance issues.`);
    }
  });

program.parse(process.argv);
