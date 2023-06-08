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
  pull-request: read

jobs:
  commit-me:
    name: Conventional Commit compliance
    runs-on: ubuntu-latest
    steps:
      - uses: dev-build-deploy/commit-me@v0
        with:
          token: ${{ github.token }}
```

### Inputs

| Name | Required | Description |
| --- | --- | --- |
| `token` | *YES* | GitHub token needed to access your commits in your pull request |

### Permissions

| Name | Value | Comment |
| --- | --- | --- |
| `pull-requests` | `read` | Access to read pull request data, including associated commits |

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/