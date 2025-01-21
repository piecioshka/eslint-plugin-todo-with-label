const simpleGit = require("simple-git");
const debug = require("debug");

const console = {
  log: debug("eslint:plugins:todo-with-label:log"),
};

const types = [
  "TODO",
  "NOTE",
  "COMMENT",
  "FIXME",
  "BUG",
  "HACK",
  "INFO",
  "XXX",
];

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Supports TODO comments with a label in parentheses",
      recommended: true,
    },
    messages: {
      "without-label": "'{{ text }}' should have a label",
      "invalid-pattern": "'{{ text }}' doesn't match the pattern {{ pattern }}",
    },
    fixable: "code",
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
    const git = simpleGit();
    const { options } = context;
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();
    const passedTypes = options[0]?.types;
    const passedPattern = options[0]?.pattern?.trim();

    const usedTypes = (passedTypes || types).join("|");
    const STARTS_WITH_TYPE_PATTERN = new RegExp(`^(${usedTypes})(.*)$`);
    const defaultPattern = `^(${usedTypes})\$begin:math:text$(\\\\w+)\\$end:math:text$: (.*)$`;

    const [messageId, validPattern] = passedPattern
      ? ["invalid-pattern", new RegExp(passedPattern)]
      : ["without-label", new RegExp(defaultPattern)];

    /**
     * Extract the author's email from the Git blame output.
     * @param {string} blameOutput The output from the `git blame` command.
     * @returns {string} The email of the author or "unknown" if not found.
     */
    function extractAuthorEmail(blameOutput) {
      const emailMatch = blameOutput.match(/author-mail <([^>]+)>/);
      return emailMatch ? emailMatch[1] : "unknown";
    }

    comments.forEach((comment) => {
      const text = comment.value.trim();

      if (!STARTS_WITH_TYPE_PATTERN.test(text)) {
        return;
      }

      if (!validPattern.test(text)) {
        console.log("❌", text);
        context.report({
          loc: comment.loc,
          messageId,
          data: { text, pattern: validPattern },
          fix: async (fixer) => {
            const filePath = context.getFilename();
            const line = comment.loc.start.line;

            try {
              // Fetch Git blame info for the line
              const blameOutput = await git.raw([
                "blame",
                "-L",
                `${line},${line}`,
                "--porcelain",
                filePath,
              ]);
              const email = extractAuthorEmail(blameOutput);

              // Format the fixed comment
              const fixedComment = text.match(STARTS_WITH_TYPE_PATTERN)
                ? `${RegExp.$1}(${email}): ${RegExp.$2.trim()}`
                : `TODO(${email}): ${text}`;
              return fixer.replaceText(comment, `// ${fixedComment}`);
            } catch (error) {
              console.log("Git blame error:", error.message);
              return null;
            }
          },
        });
      } else {
        console.log("✅", text);
      }
    });

    return {};
  },
};
