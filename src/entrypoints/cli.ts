#!/usr/bin/env node

/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Command } from "commander";
import { GitSource } from "../datasources";
import { validate } from "../validator";

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
  .action(async options => {
    console.log("📄 CommitMe - Conventional Commit compliance validation");
    console.log("-------------------------------------------------------");

    const datasource = new GitSource(options.baseBranch ?? "main");
    const commits = await datasource.getCommitMessages();

    let errorCount = 0;
    const results = validate(commits);

    for (const commit of results) {
      console.log(
        `${commit.errors.length === 0 ? "✅" : "❌"} ${commit.commit.hash}: ${commit.commit.message.substring(0, 77)}${
          commit.commit.message.length > 80 ? "..." : ""
        }`
      );
      commit.errors.forEach(error => console.log(error));
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
