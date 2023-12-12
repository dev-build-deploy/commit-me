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

## Configuration file

You can create a global configuration file:

```json
{
  "types": [ "build", "chore", "ci", "docs", "style", "refactor", "perf", "test" ],
  "scopes": [ "server", "client" ]
}
```

| Configuration Item | Description |
| -------------------| ------------|
| `types`            | Conventional Commit types to allow. By default it always supports `feat` and `fix`. |
| `scopes`           | Conventional Commit scopes to allow. No restrictions will be applied when not specified. |

> :bulb: By default, CommitMe will attempt to load `.commit-me.json` in the root of your repository

## Contributing

If you have suggestions for how commit-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

- [MIT](./LICENSES/MIT.txt) © 2023 Kevin de Jong \<monkaii@hotmail.com\>
- [CC-BY-3.0](./LICENSES/CC-BY-3.0.txt) © 2023 Free Software Foundation Europe e.V.

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/
