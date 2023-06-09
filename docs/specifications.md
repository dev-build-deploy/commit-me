<!-- 
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
SPDX-License-Identifier: CC-BY-3.0
-->

# Specifications

CommitMe validates against two sets of specifications:
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification)
- CommitMe's [extended Pull Request specification](#extended-pull-request-specification)

## Conventional Commits

| Identifier | Description |
| --- | --- |
| `CC-01` | Commits MUST be prefixed with a type, which consists of a noun, `feat`, `fix`, etc., followed by the OPTIONAL scope, OPTIONAL `!`, and REQUIRED terminal colon and space. | 
| `CC-04` | A scope MAY be provided after a type. A scope MUST consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., `fix(parser):` |
| `CC-05` | A description MUST immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., _fix: array parsing issue when multiple spaces were contained in string._ |

> **NOTE**: Above _3_ requirements are covered by _12_ distinct validation rules

## Extended Pull Request specification

| Identifier | Description |
| --- | --- |
| `PR-01` | A Pull Request title MUST correlate with a Semantic Versioning identifier (`MAJOR`, `MINOR`, or `PATCH`) with the same or higher precedence than its associated commits. |

> **NOTE**: These are only valid when running CommitMe as a [GitHub Action](./github-action.md).
