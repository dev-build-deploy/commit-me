<!-- 
SPDX-FileCopyrightText: 2024 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# Global configuration file

You can create a global configuration file, for example:

```json
{
  "types": [ "build", "chore", "ci", "docs", "style", "refactor", "perf", "test" ],
  "scopes": [ "server", "client" ],
  "githubAction": {
    "includeCommits": true,
    "includePullRequest": true,
    "updatePullRequestLabels": true,
  }
}
```

> [!NOTE]
> By default, CommitMe will attempt to load `.commit-me.json` in the root of your repository

## Generic settings

The following settings will be taken into account for all `CommitMe` clients ([GitHub Action](./github-action.md), [CLI](./cli.md), and [Pre-Commit](./pre-commit.md))

| Configuration Item | Description |
| -------------------| ------------|
| `types`            | Conventional Commit types to allow. By default it always supports `feat` and `fix`. |
| `scopes`           | Conventional Commit scopes to allow. No restrictions will be applied when not specified. |

## GitHub Actions settings

You can also configure the majority of inputs for the [GitHub Action](./github-action.md) using the configuration file:

| Configuration Item                     | Description |
| ---------------------------------------| ------------|
| `githubAction.includeCommits`          | Include commits associated with the Pull Request during validation; by default we use the repository configuration settings to determine this value (requires `contents:write` permission if **NOT** set). |
| `githubAction.includePullRequest`      | Include the Pull Request during validation, defaults to `true`. |
| `githubAction.updatePullRequestLabels` | Allow CommitMe to manage [labels](./github-action.md#pull-request-labels) based on the [Conventional Commits] metadata (requires `pull-requests:write` permission), defaults to `true` |

> [!WARNING]
> The inputs given to the GitHub Action take precedence over the configuration file

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/
