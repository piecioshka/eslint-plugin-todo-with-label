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
    const sourceCode = context.sourceCode;
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

    function processComment(comment) {
      const text = comment.value.trim();

      if (!STARTS_WITH_TYPE_PATTERN.test(text)) {
        return;
      }

      if (!validPattern.test(text)) {
        console.log("❌", text);
        context.report({
          loc: comment.loc,
          messageId,
          data: { text, pattern: String(validPattern) },
          fix(fixer) {
            if (passedPattern) {
              throw new Error(
                '--fix is not supported with used "pattern" option'
              );
            }
            const line = comment.loc.start.line;
            const filePath = context.filename;
            const fixedComment = buildFixedComment(line, filePath, text);
            return fixer.replaceText(comment, `// ${fixedComment}`);
          },
        });
      } else {
        console.log("✅", text);
      }
    }

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        comments
          .filter((token) => token.type === "Line")
          .forEach(processComment);
      },
    };
  },
};
