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
  .action(async options => {
    console.log("📄 CommitMe - Conventional Commit compliance validation");
    console.log("-------------------------------------------------------");

    // Set the global configuration
    const config = Configuration.getInstance();
    config.includeCommits = true;
    config.includePullRequest = false;
    config.scopes = options.scopes ?? [];
    config.types = options.types ?? [];

    const datasource = new GitSource(options.baseBranch ?? "main");
    const commits = await datasource.getCommitMessages();

    let errorCount = 0;
    const results = validateCommits(commits);

    for (const commit of results) {
      console.log(
        `${commit.errors.length === 0 ? "✅" : "❌"} ${commit.commit.hash}: ${commit.commit.subject.substring(0, 77)}${
          commit.commit.subject.length > 80 ? "..." : ""
        }`
      );
      commit.errors.forEach(error => console.log(error, os.EOL));
      errorCount += commit.errors.length;
    }

    console.log("-------------------------------------------------------");
    if (errorCount === 0) {
      console.log(`✅ All your commits are compliant with Conventional Commit.`);
    } else {
      program.error(`❌ Found ${errorCount} Conventional Commit compliance issues.`);
    }
  });

program.parse(process.argv);
