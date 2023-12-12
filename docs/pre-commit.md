<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# Pre-commit hook

You can add CommitMe as a [pre-commit](https://pre-commit.com) by:

1. [Installing pre-commit](https://pre-commit.com/#install)
2. Including CommitMe in your `.pre-commit.config.yaml` file, e.g.:

```yaml
repos:
- repo: https://github.com/dev-build-deploy/commit-me
  rev: v0.12.0
  hooks:
  - id: commit-me
```
3. Installing the `commit-msg` hooks
```
$ pre-commit install --hook-type commit-msg 
```

## Configuration

The Pre-Commit hook will run the `./bin/pre-commit-me` executable:

```sh
Usage: pre-commit-me [options] <file>

Conventional Commit message validation (pre-commit hook)

Arguments:
  file                 The file containing the commit messages to validate.

Options:
  -c, --config <file>  The configuration file to use.
  -h, --help           display help for command
  ```

Therefor, you can use the `args` keyword to specify a list of `options`, for example:

```yml
repos:
- repo: https://github.com/dev-build-deploy/commit-me
  rev: v0.13.1
  hooks:
  - id: commit-me
    args: [
      # Specify a custom configuration file path
      '--config', '.github/.commit-me.json'
    ]
```