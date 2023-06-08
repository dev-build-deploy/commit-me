#!/usr/bin/env node

/* 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Command } from "commander";
import { GitSource } from "../datasources";
import { RequirementError, parse } from "../conventional_commit";

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
  .action(async () => {
    console.log("📄 CommitMe - Conventional Commit compliance validation");
    console.log("-------------------------------------------------------");

    const errors: string[] = [];
    const datasource = new GitSource();

    try {
      const commits = await datasource.getCommitMessages();
      commits.forEach(commit => {
        try {
          parse(commit);
        } catch (error) {
          if (Array.isArray(error)) {
            error.filter(e => e instanceof RequirementError).forEach(e => errors.push(e.message));
          }
        }
      });
    } catch (error) {
      console.log(error);
    }

    console.log(errors.join("\n"));
  });

program.parse(process.argv);
