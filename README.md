<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# CommitMe

CommitMe provides a [Pre-commit hook](./docs/pre-commit.md), [GitHub Action](./docs/github-action.md), and [Command Line Interface](./docs/cli.md) for validating commit messages against the [Conventional Commits] specification;

- Rich error messages to help identify non-compliances:

<img src="./docs/images/cli_example.svg" width="100%">

- Adds labels (`feature`, `fix`, or `breaking`) to your Pull Request
- Limiting Conventional Commits `scope` and `types`.

Please refer to the document related to your environment for more details on the usage instructions:

- [GitHub Actions](./docs/github-action.md)
- [Command Line Interface](./docs/cli.md)
- [Pre-commit Hook](./docs/pre-commit.md)

## Configuration

Please refer to the [Global Configuration documentation](./docs/config.md) for details on how to configure `CommitMe`.

## Contributing

If you have suggestions for how commit-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [MIT](./LICENSES/MIT.txt) © 2023 Kevin de Jong \<monkaii@hotmail.com\>
- [CC-BY-3.0](./LICENSES/CC-BY-3.0.txt) © 2023 Free Software Foundation Europe e.V.

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/
