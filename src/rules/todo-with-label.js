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
].join("|");

const STARTS_WITH_TYPE_PATTERN = new RegExp(`^(${types})(.*)$`);
const TYPE_WITH_LABEL_PATTERN = new RegExp(`^(${types})\\((\\w+)\\)\\: (.*)$`);

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Support TODO comments with a label in parentheses",
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
          pattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { options } = context;
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();
    const passedPattern = options[0]?.pattern?.trim();

    const [messageId, validPattern] = passedPattern
      ? ["invalid-pattern", new RegExp(passedPattern)]
      : ["without-label", TYPE_WITH_LABEL_PATTERN];

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
        });
      } else {
        console.log("✅", text);
      }
    });

    return {};
  },
};
