<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# GitHub Action

You can scan your [pull requests](#pull-request-scanning) for determining compliance with [Conventional Commits]. Running this GitHub Action will result in output similar to:

![Example](./images/action-example.png)

## Workflows

### Pull Request scanning

You can scan the commits in your pull request for compliance with the [Conventional Commits] specification.

#### Workflow

```yaml
name: Conventional Commits
on:
  pull_request:

permissions:
  pull-request: write

jobs:
  commit-me:
    name: Conventional Commit compliance
    runs-on: ubuntu-latest
    steps:
      - uses: dev-build-deploy/commit-me@v0
        with:
          token: ${{ github.token }}
          update-labels: true  # OPTIONAL; manages labels on your Pull Request, defaults to `true`
```

#### Labels

CommitMe is able to manage labels on your Pull Request based on the Conventional Commit metadata:

| Label | Description |
| --- | --- |
| `breaking` | One of the commits in your Pull Request contains a breaking change indicator (`!`) |
| `feature` | One of the commits in your Pull Request uses `feat:` as type |
| `fix` | One of the commits in your Pull Request uses `fix:` as type |

> **NOTE**: CommitMe will remove any of the above labels from the Pull Request if no longer applicable.

### Inputs

| Name | Required | Description |
| --- | --- | --- |
| `token` | *YES* | GitHub token needed to access your commits in your pull request |
| `update-labels` | *NO* | Allow CommitMe to manage [labels](#labels) based on the [Conventional Commits] metadata, required `write` permissions for `pull-request`, defaults to `true` |

### Permissions

| Name | Value | Comment |
| --- | --- | --- |
| `pull-request` | `read` | Access to read pull request data, including associated commits |
| `pull-request` | `write` | Only required when the `update-labels`-input is set to `true`, allows for updating labels associated with the [Conventional Commits] in your Pull Request |

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/