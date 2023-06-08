<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
-->

# CommitMe

CommitMe provides [multiple tools](#tooling) for validating commit messages against [Conventional Commits].

## Tooling

There are two main options available:

* A CLI tool for managing your local (git) repository
* A GitHub Action to validate your Pull Request/Repository contents

### Command Line Interface

The CLI tool can be used for local operations around your git repository, validating the commits in your current branch against the main branch (`main`).

> **NOTE** Option to specifiy the baseline branch will be added later

#### Example usage

Running the `check` command...
```
$ commit-me check
```

...will result in output similar to:

![Example](./docs/images/cli_example.png)

> **NOTE**: highlighting and colors are applied in case your shell support this.

_You can find more details in the [dedicated documentation](./docs/cli.md)_

### GitHub Action

The GitHub Action will validate all commits as part of your current Pull Request.

### Example usage

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

This will result in output similar to:

![Example](./docs/images/action-example.png)

In addition, annotations are added containing a non-compliance issue.

_You can find more details in the [dedicated documentation](./docs/github-action.md)_

## Contributing

If you have suggestions for how reuse-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[GPL-3.0-or-later AND CC0-1.0](LICENSE) © 2023 Kevin de Jong \<monkaii@hotmail.com\>

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/
