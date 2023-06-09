/*
SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>

SPDX-License-Identifier: GPL-3.0-or-later
*/

/**
 * Error message with a caret pointing to the location of the error.
 * The message is loosely based on the LLVM "Expressive Diagnostics"
 * specification.
 * @member message Error message
 * @member hash Commit hash
 * @member line Commit message
 * @member start Start index of the error
 * @member end End index of the error
 *
 * @see https://clang.llvm.org/docs/ClangFormatStyleOptions.html#expressive-diagnostic-formatting
 */
class ExpressiveMessage {
  message: string;

  constructor(error: string, id: string, line: string, start?: number, length?: number) {
    const GREEN = "\x1b[0;32m";
    const RED = "\x1b[1;31m";
    const RESET = "\x1b[0m\x1b[1m";

    const end = start !== undefined ? start + (length ?? 0) : undefined;
    const caret = this.addCaret(start, end);

    this.message = `\x1b[1m${id}:1:${start}: ${RED}error:${RESET} ${error}\x1b[0m\n  ${line}`;
    if (caret) this.message += `\n  ${GREEN}${caret}\x1b[0m`;
  }

  /**
   * Creates a LLVM Expressive Diagnostics caret.
   * @returns string containing the error message with a caret
   * @see https://clang.llvm.org/docs/ClangFormatStyleOptions.html#expressive-diagnostic-formatting
   */
  private addCaret = (start?: number, end?: number) => {
    if (start === undefined || end === undefined) return "";
    return `${" ".repeat(start)}${"^".padEnd(end - start, "-")}`;
  };

  toString() {
    return this.message;
  }
}

export { ExpressiveMessage };
