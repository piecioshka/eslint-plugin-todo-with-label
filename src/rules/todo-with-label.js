const fs = require("fs");
const { execSync } = require("child_process");
const debug = require("debug");

const console = {
  log: debug("eslint:plugins:todo-with-label:log"),
};

const DEFAULT_AUTHOR_EMAIL = "unknown@unknown.com";

const DEFAULT_TYPES = [
  "TODO",
  "NOTE",
  "COMMENT",
  "FIXME",
  "BUG",
  "HACK",
  "INFO",
  "XXX",
];

function clearText(text) {
  const textWithoutPrefix = /^[\s:-]*(.*)$/;
  const matched = text.match(textWithoutPrefix);
  return matched ? matched[1] : text;
}

// Strips leading whitespace and an optional JSDoc-style asterisk from a
// single line of a block comment. Returns the cleaned content along with
// the length of the removed prefix (needed to compute fix ranges).
function stripBlockLinePrefix(rawLine) {
  const match = rawLine.match(/^(\s*\*?\s?)(.*)$/);
  const prefix = match ? match[1] : "";
  const content = match ? match[2] : rawLine;
  return { prefix, content };
}

function extractAuthorEmail(blameOutput) {
  const emailMatch = blameOutput.match(/author-mail <([^>]+)>/);
  return emailMatch ? emailMatch[1] : DEFAULT_AUTHOR_EMAIL;
}

function extractNameFromEmail(email) {
  const nameMatch = email.split("@");
  return nameMatch ? nameMatch[0] : email;
}

function getGitEmail(line, filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return DEFAULT_AUTHOR_EMAIL;
    }
    const command = `git blame -L ${line},${line} --porcelain ${filePath}`;
    const blameOutput = execSync(command, { encoding: "utf-8" });
    return extractAuthorEmail(blameOutput);
  } catch (error) {
    return DEFAULT_AUTHOR_EMAIL;
  }
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "layout",
    fixable: "code",
    docs: {
      description: "Supports TODO comments with a label in parentheses",
      recommended: true,
    },
    messages: {
      "without-label": "'{{ text }}' should have a label",
      "invalid-pattern": "'{{ text }}' doesn't match the pattern {{ pattern }}",
    },
    schema: [
      {
        type: "object",
        properties: {
          types: { type: "array", items: { type: "string" } },
          pattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const { options } = context;
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const passedTypes = options[0]?.types;
    const passedPattern = options[0]?.pattern?.trim();

    const usedTypes = (passedTypes || DEFAULT_TYPES).join("|");
    const STARTS_WITH_TYPE_PATTERN = new RegExp(`^(${usedTypes})(.*)$`);
    const defaultPattern = `^(${usedTypes})\\((\\w+)\\)\\s*\\:\\s+(.*)$`;

    const [messageId, validPattern] = passedPattern
      ? ["invalid-pattern", new RegExp(passedPattern)]
      : ["without-label", new RegExp(defaultPattern)];

    function buildFixedComment(line, filePath, text) {
      const email = getGitEmail(line, filePath);
      const name = extractNameFromEmail(email);
      const match = text.match(STARTS_WITH_TYPE_PATTERN);
      const [_, type, rest] = match;
      const clearRest = clearText(rest);
      const fixedComment = `${type}(${name}): ${clearRest}`;
      return fixedComment;
    }

    // Validates a single TODO-like text and reports it when invalid.
    // `loc` is the location to report on; `buildFix` receives the fixer and
    // the rebuilt comment text and returns the actual fix.
    function validate(text, line, loc, buildFix) {
      if (!STARTS_WITH_TYPE_PATTERN.test(text)) {
        return;
      }

      if (!validPattern.test(text)) {
        console.log("❌", text);
        context.report({
          loc,
          messageId,
          data: { text, pattern: String(validPattern) },
          fix(fixer) {
            if (passedPattern) {
              throw new Error(
                '--fix is not supported with used "pattern" option',
              );
            }
            const filePath = context.filename;
            const fixedComment = buildFixedComment(line, filePath, text);
            return buildFix(fixer, fixedComment);
          },
        });
      } else {
        console.log("✅", text);
      }
    }

    function processLineComment(comment) {
      const text = comment.value.trim();
      const line = comment.loc.start.line;
      validate(text, line, comment.loc, (fixer, fixedComment) =>
        fixer.replaceText(comment, `// ${fixedComment}`),
      );
    }

    function processSingleLineBlockComment(comment) {
      const text = comment.value.trim();
      const line = comment.loc.start.line;
      validate(text, line, comment.loc, (fixer, fixedComment) =>
        fixer.replaceText(comment, `/* ${fixedComment} */`),
      );
    }

    function processMultiLineBlockComment(comment) {
      // `comment.value` is the block's inner text (without `/*` and `*/`).
      // Each line is validated independently after its prefix (indentation
      // and an optional `*`) is stripped, so JSDoc-style blocks work.
      const lines = comment.value.split("\n");
      // Offset of the first inner character within the full source:
      // skip `/*` (2 chars) past the comment's start.
      let offset = comment.range[0] + 2;

      lines.forEach((rawLine, index) => {
        const { prefix, content } = stripBlockLinePrefix(rawLine);
        const text = content.trim();
        const line = comment.loc.start.line + index;
        const contentStart = offset + prefix.length;
        const loc = {
          start: { line, column: prefix.length },
          end: { line, column: rawLine.length },
        };

        validate(text, line, loc, (fixer, fixedComment) =>
          fixer.replaceTextRange(
            [contentStart, contentStart + content.length],
            fixedComment,
          ),
        );

        // Advance past this line and the `\n` that separated it.
        offset += rawLine.length + 1;
      });
    }

    function processComment(comment) {
      if (comment.type === "Line") {
        processLineComment(comment);
      } else if (comment.loc.start.line === comment.loc.end.line) {
        processSingleLineBlockComment(comment);
      } else {
        processMultiLineBlockComment(comment);
      }
    }

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        comments.forEach(processComment);
      },
    };
  },
};
