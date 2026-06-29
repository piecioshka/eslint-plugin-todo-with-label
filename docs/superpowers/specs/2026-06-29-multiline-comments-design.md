# Support multiline (block) comments — design

Issue: [#3 Support multiline comments](https://github.com/piecioshka/eslint-plugin-todo-with-label/issues/3)

## Problem

The rule currently only scans line comments (`//`). Block comments are
skipped because `Program()` filters `token.type === "Line"`. As a result
TODOs written as `/* TODO: ... */` or in JSDoc-style multiline blocks are
never validated.

```js
// validated today
// TODO: foo

/* TODO: foo */ // ignored
/*
 * TODO: foo             // ignored
 */
```

## Scope

Validate **all** comment kinds:

1. Line comments (`//`) — unchanged behavior.
2. Single-line block comments (`/* TODO: ... */`).
3. Multiline block comments (JSDoc-style), validating each line
   independently, after stripping leading `*` and indentation.

Autofix (`--fix`) works for all of the above. For multiline blocks the
fix rewrites only the offending line's TODO text, preserving delimiters
(`/*`, `*/`), leading asterisks, and indentation.

Out of scope (YAGNI): changing the default pattern, touching `git blame`,
changing the options API.

## Architecture

All changes live in `src/rules/todo-with-label.js`.

### 1. Stop filtering by comment type

`Program()` processes every comment instead of only `Line` tokens. The
empty-source guard stays.

### 2. Dispatch in `processComment`

- **Line** (`comment.type === "Line"`): existing path, fix rebuilds `// ...`.
- **Single-line block** (`loc.start.line === loc.end.line`): validate
  `comment.value.trim()`, fix rebuilds `/* ... */`.
- **Multiline block**: split `comment.value` on `\n`, validate each line
  after stripping its prefix; report and fix per line.

### 3. `stripBlockLinePrefix(rawLine)`

Removes leading whitespace and an optional asterisk (`/^\s*\*?\s?/`).
Returns the cleaned content and the prefix length (needed to compute the
fix range precisely).

### 4. Per-line fixer for blocks

Instead of `fixer.replaceText(comment, ...)` (whole token), compute the
character range of the offending line's content from `comment.range[0]`,
the `/*` delimiter (2 chars), and the cumulative length of preceding
lines plus their `\n`. `fixer.replaceTextRange([start, end], fixed)`
swaps only the TODO text, leaving asterisks, indentation, and delimiters
untouched.

### 5. Per-line `loc`

Reports target the specific offending line:
`{ start: { line: loc.start.line + i, column }, end: ... }`. Line comments
and single-line blocks keep `comment.loc`.

### 6. Multiple TODOs per block

A block may contain several TODO lines; each is reported and fixed
independently. This falls out naturally from per-line iteration. ESLint
merges the non-overlapping fixes.

### 7. `--fix` with `pattern` option

Unchanged: the fixer still throws when the `pattern` option is set,
for every comment kind (consistency with current behavior).

## Testing

Replace the four `test.todo("multi line", ...)` stubs with working tests:

- single-line block valid/invalid + fix output,
- multiline JSDoc valid/invalid + fix (asterisks/indentation preserved),
- multiple TODOs in one block,
- block with no TODO (ignored).

Fix tests yield `unknown` as the label: `RuleTester` runs on a virtual
file with no git, so `getGitEmail` returns `DEFAULT_AUTHOR_EMAIL`.

## Docs

Update `README.md`: note block / multiline comment support in Features and
add valid/invalid `/* */` examples.
