<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# GitHub Action

You can scan your [pull requests](#pull-request-scanning) for determining compliance with [Conventional Commits]. Running this GitHub Action will result in output similar to:

![Example](./images/action-example.png)

## Validation strategies

Currently there are two distinct [Conventional Commits] validation strategies implemented;
- Validate the Pull Request title and all associated commits _(default behavior)_.
- **ONLY** validate the Pull Request title.

Selection of the strategy is based on either:
- The allowed merge strategies in your repository (the `contents: write` permission needs to be set in order for this detection to work.)
- Manually configuring the `include-commits` input parameter

## Workflows

### Pull Request and associated commit scanning

In order to scan your pull request, including associated commits, for compliance with the [Conventional Commits] specification;

```yaml
name: Conventional Commits
on:
  pull_request:
    types:
      - opened
      - edited
      - synchronize

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}  # Ensure that only one instance of this workflow is running per Pull Request
  cancel-in-progress: true  # Cancel any previous runs of this workflow

permissions:
  contents: read  # NOTE; you will need to change this permission to `write` in case you do not provide the `include-commits` input parameter.
  pull-requests: write  # OPTIONAL; only required when you want CommitMe to update labels in your Pull Request, set `update-labels` to `false` if you do not require this feature.

jobs:
  commit-me:
    name: Conventional Commits Compliance
    runs-on: ubuntu-latest
    steps:
      - uses: dev-build-deploy/commit-me@v0
        with:
          token: ${{ github.token }}  # Required to retrieve the commits associated with your Pull Request
          include-commits: true  # OPTIONAL; forces the inclusion of commits associated with your Pull Request
```

### Pull Request scanning (w/o Pull Request labels)

You can also opt for limiting the validation to your Pull Request only. This option is preferred when you do **NOT** have rebase merges enabled;

```yaml
name: Conventional Commits
on:
  pull_request:
    types:
      - opened
      - edited
      - synchronize

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}  # Ensure that only one instance of this workflow is running per Pull Request
  cancel-in-progress: true  # Cancel any previous runs of this workflow

permissions:
  contents: read  # NOTE; you will need to change this permission to `write` in case you do not provide the `include-commits` input parameter.

jobs:
  commit-me:
    name: Conventional Commits Compliance
    runs-on: ubuntu-latest
    steps:
      - uses: dev-build-deploy/commit-me@v0
        with:
          update-labels: false  # OPTIONAL; do not update the Pull Request labels based on the Conventional Commits information.
          include-commits: false  # OPTIONAL; enforces the exclusion of commits associated with your Pull Request
```

In addition, above example has disabled pull request label management, just to show 

### Event triggers & activities

We recommend using the [`pull_request`](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request) trigger for running this GitHub Action.

In addition, we recommend the following activity types: 
| Activity | Description |
| --- | --- |
| `opened` | Validates all commits in the source branch of your Pull Request upon opening the PR |
| `edited` | Validates any change to the Pull Requests title |
| `synchronize` | Validate all subsequent commits added to the (open) Pull Request. This is only required in case rebase merges are enabled on the target repository. |

> **NOTE**: Although supported, the trigger `pull_request_target` has elevated permissions to access secrets and your repository. Please refer to this [GitHub security blog post](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/) for more details 

### Inputs

| Name | Required | Description |
| --- | --- | --- |
| `token` | *NO* | GitHub token needed to access your commits in your pull request. This is **only** required in case you want to:<br><ul><li>Validate commits associated with your Pull Request</li><li>Update labels in your Pull Request</li></ul> |
| `update-labels` | *NO* | Allow CommitMe to manage [labels](#pull-request-labels) based on the [Conventional Commits] metadata (requires `write` permissions for `pull-requests`), defaults to `true` |
| `include-commits` | *NO* | Include commits associated with the Pull Request; by default we use the repository configuration settings to determine this value (requires `write` permissions for `contents`). |

### Permissions

| Name | Value | Comment |
| --- | --- | --- |
| `pull-request` | `read` | Access to read pull request data, including associated commits |
| `pull-request` | `write` | Only required when the `update-labels`-input is set to `true`, allows for updating labels associated with the [Conventional Commits] in your Pull Request |
| `contents` | `write` | This permission is required in order to determine whether this repository allows rebase merges (see: [validation strategies](#validation-strategies))<br><br>If you do not want to provide this permission, you can also use the `include-commits` [input parameter](#inputs) to bypass the automatic check. |

## Pull Request Labels

CommitMe is able to manage labels on your Pull Request based on the Conventional Commit metadata:

| Label | Description |
| --- | --- |
| `breaking` | One of the commits in your Pull Request contains a breaking change indicator (`!`) |
| `feature` | One of the commits in your Pull Request uses `feat:` as type |
| `fix` | One of the commits in your Pull Request uses `fix:` as type |

> **NOTE**: CommitMe will remove any of the above labels from the Pull Request if no longer applicable.

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/
