#!/bin/sh

# SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
# SPDX-License-Identifier: MIT

# `claude plugin test` runs every *.test.ts under its folder, which would pick up the jest tests in test/.
# Stage only the plugin's files (the lib/ build included) and test those.
set -e
root=$(cd "$(dirname "$0")/.." && pwd)
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
cp -R "$root/.claude-plugin" "$root/hooks" "$root/bin" "$root/lib" "$stage/"
claude plugin test "$stage"
