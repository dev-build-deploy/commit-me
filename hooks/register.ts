/*
 * SPDX-FileCopyrightText: 2026 Kevin de Jong <monkaii@hotmail.com>
 * SPDX-License-Identifier: MIT
 */

import type { Register } from "claude-code";

type Parsed = { message?: string; file?: string; skip?: boolean };

const GIT_COMMIT = /(?:^|[;&|(\s])git\s+((?:(?:-c|-C)\s+\S+\s+|--no-pager\s+)*)commit(?=\s|$)/;
const HEREDOC = /<<-?\s*(['"]?)(\w+)\1[^\n]*\n([\s\S]*?)\n[ \t]*\2(?=\s|\)|$)/;
const EXEMPT_SUBJECT = /^(Merge |fixup! |squash! |amend! )/;

/** Splits the shell words of the first simple command, honouring quotes; stops at an unquoted operator. */
function words(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  let has = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") {
      const end = text.indexOf("'", i + 1);
      cur += text.slice(i + 1, end < 0 ? undefined : end);
      i = end < 0 ? text.length : end;
      has = true;
    } else if (c === '"') {
      i++;
      for (; i < text.length && text[i] !== '"'; i++) {
        if (text[i] === "\\" && '"\\$`\n'.includes(text[i + 1] ?? "")) i++;
        cur += text[i];
      }
      has = true;
    } else if (c === "\\" && i + 1 < text.length) {
      cur += text[++i];
      has = true;
    } else if (/\s/.test(c)) {
      if (c === "\n" && !has && out.length === 0) continue;
      if (c === "\n") break;
      if (has) out.push(cur);
      cur = "";
      has = false;
    } else if (";&|".includes(c)) {
      break;
    } else {
      cur += c;
      has = true;
    }
  }
  if (has) out.push(cur);
  return out;
}

/** Finds the message source of a `git commit` command. Undefined: not a commit, or nothing to check. */
export function parseCommit(command: string): Parsed | undefined {
  const m = GIT_COMMIT.exec(command);
  if (!m) return undefined;
  if (/(^|\s)-C\s/.test(m[1] ?? "")) return { skip: true };
  const rest = command.slice(m.index + m[0].length);

  const heredoc = HEREDOC.exec(rest);
  if (heredoc && /(\s-[a-zA-Z]*m\b|--message|\s-F\s*-|--file=-)/.test(rest.slice(0, heredoc.index))) {
    return { message: heredoc[3] };
  }

  const args = words(rest);
  const messages: string[] = [];
  let file: string | undefined;
  let amend = false;
  let noEdit = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--amend") amend = true;
    else if (a === "--no-edit") noEdit = true;
    else if (/^-[a-zA-Z]*m$/.test(a) || a === "--message") messages.push(args[++i] ?? "");
    else if (a.startsWith("--message=")) messages.push(a.slice(10));
    else if (/^-m./.test(a)) messages.push(a.slice(2));
    else if (a === "-F" || a === "--file") file = args[++i];
    else if (a.startsWith("--file=")) file = a.slice(7);
    else if (/^-F./.test(a)) file = a.slice(2);
  }
  if (amend && noEdit && messages.length === 0 && !file) return { skip: true };
  if (messages.length > 0) return { message: messages.join("\n\n") };
  if (file && file !== "-") return { file };
  return { skip: true };
}

// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, "");

export const register: Register = on => {
  let noted = false;

  on("tool.call", { tool: "Bash" }, async ($, e, next) => {
    const parsed = parseCommit(e.command);
    if (!parsed || parsed.skip) return next(e);

    const note = (why: string) => {
      if (!noted) {
        noted = true;
        $.ui.toast(`commit-me: message not checked (${why}).`);
      }
      return next(e);
    };

    let message = parsed.message;
    if (message === undefined && parsed.file) {
      try {
        message = await $.fs.read(parsed.file);
      } catch {
        return next(e); // git reports an unreadable file itself
      }
    }
    if (message === undefined || message.trim() === "" || message.includes("$(")) return next(e);
    if (EXEMPT_SUBJECT.test(message)) return next(e);

    // A merge in progress commits git's own message.
    const merge = await $.process.run(["git", "rev-parse", "-q", "--verify", "MERGE_HEAD"]).catch(() => undefined);
    if (merge?.exitCode === 0) return next(e);

    const config = (await $.fs.exists(".commit-me.json"))
      ? ".commit-me.json"
      : (await $.fs.exists(".github/.commit-me.json"))
        ? ".github/.commit-me.json"
        : undefined;

    const cli = `${$.plugin.root}/bin/pre-commit-me`;
    if (!(await $.fs.exists(`${$.plugin.root}/lib/precommit/index.js`))) return note("commit-me is not built");

    // A message file, not /dev/stdin: on Linux a child's stdin is a socket, which open("/dev/stdin") rejects (ENXIO).
    let tmp: string;
    let run;
    try {
      tmp = (await $.process.run(["mktemp"])).stdout.trim();
      await $.fs.write(tmp, message);
      const args = ["node", cli, ...(config ? ["--config", config] : []), tmp];
      try {
        run = await $.process.run(args);
      } finally {
        await $.process.run(["rm", "-f", tmp]).catch(() => undefined);
      }
    } catch {
      return note("node or mktemp is not available");
    }
    if (run.exitCode === 0) return next(e);

    const out = stripAnsi(`${run.stdout}\n${run.stderr}`).trim();
    if (!/compliance issues/.test(out)) return note("commit-me could not run");

    let allowed = "types: feat, fix (default)";
    if (config) {
      try {
        const cfg = JSON.parse(await $.fs.read(config));
        const types = ["feat", "fix", ...(cfg.types ?? [])];
        const scopes: string[] = cfg.scopes ?? [];
        allowed = `Allowed types: ${types.join(", ")}. Allowed scopes: ${scopes.length ? scopes.join(", ") : "any"}.`;
      } catch {
        allowed = `Allowed types and scopes: see ${config}.`;
      }
    } else {
      allowed = "Allowed types: feat, fix (no .commit-me.json found, so no others). Scopes: any.";
    }

    return {
      deny: `commit-me: the commit message is not a compliant Conventional Commit; nothing was committed.\n\n${out}\n\n${allowed}\nForm: <type>[(scope)][!]: <description>, then an optional body and footers (BREAKING CHANGE: ...). Rewrite the message and commit again.`,
    };
  });
};
