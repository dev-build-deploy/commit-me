---
name: conventional-commits
description: Write a Conventional Commit message that commit-me accepts. Use before every git commit, when choosing a type or scope, or after the commit-me hook denied a message.
---

# Conventional Commits with commit-me

Repositories that use commit-me reject commit messages in CI that do not follow the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) form. A hook in this plugin checks the message
before `git commit` runs; this skill is how to get it right the first time.

## Form

```text
<type>[(scope)][!]: <description>

[body]

[footer(s)]
```

- Subject: lower-case type, optional scope in parentheses, `!` for a breaking change, a colon and a space, then a short
  imperative description without a trailing full stop (`add a flag`, not `added a flag.`).
- Body and footers are separated from the subject by one blank line.
- Keep the subject on one line, ideally under 72 characters.

## Which type

Read the repository's allowed values first: `.commit-me.json` or `.github/.commit-me.json` (`types` and `scopes`).
`feat` and `fix` are always allowed; the file adds the others. Without a config only `feat` and `fix` exist.

| Type | Use it for |
| --- | --- |
| `feat` | A new capability for the user (a minor release). |
| `fix` | A bug fix (a patch release). |
| `docs` | Documentation only. |
| `refactor` | A code change that neither fixes a bug nor adds a feature. |
| `perf` | A change that improves performance. |
| `test` | Adding or correcting tests. |
| `build` | The build system or dependencies of the product. |
| `ci` | CI configuration and workflows. |
| `chore` | Upkeep that fits none of the above (dependency bumps often use `chore(deps)`). |
| `style` | Formatting only, no change in meaning. |

Use only the types the repository lists. When two fit, take the one that matches what a user of the project sees.

## Scope

A scope is optional. When the config lists `scopes`, a scope **must** be one of them, otherwise the message is rejected.
Pick the part of the project the change touches (`feat(cli): ...`). When no listed scope fits, leave the scope out.

## Breaking changes

Either mark the type or scope with `!`, or add a footer, or both:

```text
feat(api)!: drop the v1 endpoints

BREAKING CHANGE: clients must move to the v2 endpoints.
```

## Examples

```text
feat(cli): add a --config option
fix: handle an empty commit message
docs: describe the pre-commit setup
chore(deps): bump commander from 11 to 12
refactor(action)!: rename the include-commits input

BREAKING CHANGE: the input is now called commits.
```

Not accepted: `Added a flag`, `feature: add a flag` (unknown type), `fix(unknown-scope): x` (scope not in the config),
`fix : x` (space before the colon), `Fix: x` (type must be lower-case).

## When the hook denies a commit

The denial carries commit-me's own message and the allowed types and scopes. Rewrite the message, then commit again; do
not bypass the check. Merge commits (`Merge ...`, a merge in progress), `fixup!`/`squash!` subjects and
`git commit --amend --no-edit` are not checked.
