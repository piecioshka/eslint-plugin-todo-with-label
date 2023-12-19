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
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();
    const passedTypes = options[0]?.types;
    const passedPattern = options[0]?.pattern?.trim();

    const usedTypes = (passedTypes || types).join("|");
    const STARTS_WITH_TYPE_PATTERN = new RegExp(`^(${usedTypes})(.*)$`);
    const defaultPattern = `^(${usedTypes})\\((\\w+)\\)\\: (.*)$`;

    const [messageId, validPattern] = passedPattern
      ? ["invalid-pattern", new RegExp(passedPattern)]
      : ["without-label", new RegExp(defaultPattern)];

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
