<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
SPDX-License-Identifier: MIT
-->

# Command Line Interface

## Installation instructions

A pre-compiled version of the CLI is already provided as part of this repository. One can therefore:

```sh
# Install the CLI tool
$ npm install -g https://github.com/dev-build-deploy/commit-me

# Run the CLI tool
$ commit-me
```

## Usage instructions

### Basic Usage

You can find more information about the possible commands with the `--help` flag, i.e.:

```sh
$ commit-me --help

Usage: commit-me [options] [command]

Conventional Commit message validation

Options:
  -h, --help       display help for command

Commands:
  check [options]  Checks whether your commit messagesare compliant with the Conventional Commit specification.
  help [command]   display help for command
```

### Validate the commits on your current branch

Running the `check` command will perform local validation of your branch.

```sh
$ commit-me check --help

Usage: commit-me check [options]

Checks whether your commit messagesare compliant with the Conventional Commit specification.

Options:
  -b, --base-branch <branch>  The base branch to compare the current branch with.
  -s, --scopes [scopes...]    Conventional Commits scopes to validate against.
  -t, --types [types...]      Conventional Commits types to validate against.
  -c, --config <file>         The configuration file to use.
  -h, --help                  display help for command
```

Running this command...
```sh
$ commit-me check
```

...will result in output similar to:

<img src="./images/cli_example.svg">

Additionally, you can use the `--base-branch` option to change the reference branch (default: `main`) to compare with.
