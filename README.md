<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# CommitMe

CommitMe provides a [GitHub Action](#cicd-validation-github-action) and [Command Line Interface](#local-development-command-line-interface) for:

- Validating commit messages against [Conventional Commits] and extended [Pull Request](./docs/specifications.md#extended-pull-request-specification) and [Commit Message](./docs/specifications.md#extended-conventional-commits-specification) specifications

<img src="./docs/images/cli_example.svg" width="100%">

- Adding labels (`feature`, `fix`, or `breaking`) to your Pull Request
- Limiting Conventional Commits `scope` and `types`.

## CICD Validation (GitHub Action)

The basic workflow can be set up as such:

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

_You can find more details in the [dedicated documentation](./docs/github-action.md)_

## Local Development (Command Line Interface)

Performing local validation is as simple as running the `check` command:

```
$ commit-me check
```

You can find more details in the [dedicated documentation](./docs/cli.md)

## Contributing

If you have suggestions for how commit-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [GPL-3.0-or-later, CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>
- [CC-BY-3.0](LICENSE) © 2023 Free Software Foundation Europe e.V.

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/
