/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

import * as core from "@actions/core";
import * as github from "@actions/github";

/**
 * Updates the (managed) Pull Request labels based on the commit message.
 * @param label The label to be applied to the pull request ("breaking", "feature", "fix")
 */
const updatePullRequestLabels = async (label: "fix" | "feature" | "breaking") => {
  const octokit = github.getOctokit(core.getInput("token"));
  const pullRequestNumber = github.context.payload.number;

  const { data: labels } = await octokit.rest.issues.listLabelsOnIssue({
    ...github.context.repo,
    issue_number: pullRequestNumber,
  });

  // Remove all labels that start with the associated prefix and are not the current label
  labels
    .filter(l => ["breaking", "feature", "fix"].includes(l.name) && l.name !== label)
    .forEach(async l => {
      await octokit.rest.issues.removeLabel({ ...github.context.repo, issue_number: pullRequestNumber, name: l.name });
    });

  // Add the label if it does not exist yet
  if (!labels.some(l => l.name === label)) {
    await octokit.rest.issues.addLabels({ ...github.context.repo, issue_number: pullRequestNumber, labels: [label] });
  }
};

export { updatePullRequestLabels };
