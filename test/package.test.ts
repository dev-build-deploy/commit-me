/*
 * SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import * as fs from "fs";
import * as path from "path";

// npm runs these lifecycle scripts when the package is installed from git: as a dependency, or by pre-commit's
// `language: node` hook (`npm pack` + `npm install -g`). Their output corrupts the tarball name pre-commit reads from
// `npm pack`, and a hook installer there writes into the consuming repository's .git/hooks. Contributor setup belongs
// in an explicit script (`npm run setup-hooks`), never in one of these.
const INSTALL_TIME_SCRIPTS = ["preinstall", "install", "postinstall", "prepare", "prepack", "postpack", "prepublish"];

describe("package.json", () => {
  test("runs no scripts when installed as a dependency or as a pre-commit hook", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const found = INSTALL_TIME_SCRIPTS.filter(name => name in (pkg.scripts ?? {}));
    expect(found).toEqual([]);
  });
});
