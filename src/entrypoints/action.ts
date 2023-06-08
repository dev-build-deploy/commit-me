/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as core from "@actions/core";

/**
 * Main entry point for the GitHub Action.
 */
async function run(): Promise<void> {
  try {
    core.info("📄 CommitMe - Conventional Commit compliance validation");
  } catch (ex) {
    core.setFailed((ex as Error).message);
  }
}

run();
