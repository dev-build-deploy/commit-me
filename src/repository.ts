/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import { getRepository } from "./github";
import * as core from "@actions/core";

/**
 * Checks the repository merge configuration;
 * - Whether merge commits are enabled and whether the default subject is based on the Pull Request title
 * - Whether squash commits are enabled and whether the default subject is based on the Pull Request title
 * - Whether rebase commits are enabled
 */
const checkConfiguration = async () => {
  const repository = await getRepository();

  if (
    repository.allow_merge_commit === undefined ||
    repository.allow_squash_merge === undefined ||
    repository.allow_rebase_merge === undefined
  ) {
    throw new Error(
      "❌ CommitMe is not configured correctly. Please provide either:\n - The `contents: write` permission, or\n - Use the `include-commits` input parameter."
    );
  }

  if (repository.allow_merge_commit) {
    core.info(
      // @ts-ignore - 'merge_commit_title' is a valid value, but not in the type definition
      repository.merge_commit_title === "PR_TITLE"
        ? "✅ Default merge commit subject will use the Pull Request title."
        : "⚠️ Default merge commit subject is not based on your Pull Request title."
    );
  } else {
    core.info("ℹ️ Merge commit strategy is disabled.");
  }

  if (repository.allow_squash_merge === true) {
    core.info(
      repository.use_squash_pr_title_as_default
        ? "✅ Default squash commit subject will use the Pull Request title."
        : "⚠️ Default squash commit subject is not based on your Pull Request title."
    );
  } else {
    core.info("ℹ️ Squash commit strategy is disabled.");
  }

  core.info(
    repository.allow_rebase_merge === true
      ? "ℹ️ Rebase merges are enabled, validating both Pull Request title and all associated commits."
      : "ℹ️ Rebase merges are disabled, only validating the Pull Request title."
  );
};

/**
 * Checks whether rebase merges are enabled.
 * @returns Whether rebase merges are enabled.
 */
const hasRebaseMerge = async (): Promise<boolean> => {
  return (await getRepository()).allow_rebase_merge === true;
};

export { checkConfiguration, hasRebaseMerge };
