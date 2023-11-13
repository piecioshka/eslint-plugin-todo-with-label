const debug = require("debug");

const console = {
  log: debug("eslint:plugins:todo-with-label:log"),
};

const STARTS_WITH_TODO_PATTERN = /^TODO(.*)$/;
const TODO_WITH_LABEL_PATTERN = /^TODO\((\w+)\)\: (.*)$/;

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Support TODO comments with a label in parenthesis",
      recommended: true,
      url: "https://github.com/piecioshka/eslint-plugin-todo-with-label/blob/main/docs/rules/todo-with-label.md",
    },
    fixable: null,
    messages: {
      "invalid-pattern":
        "'{{ text }}' has not match the pattern {{ pattern }}",
    },
  },
  create(context) {
    const { options } = context;
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();
    const passedPattern = options[0]?.pattern?.trim();

    const validPattern = passedPattern
      ? new RegExp(passedPattern)
      : TODO_WITH_LABEL_PATTERN;

    comments.forEach((comment) => {
      const text = comment.value.trim();

      if (!STARTS_WITH_TODO_PATTERN.test(text)) {
        return;
      }

      if (!validPattern.test(text)) {
        console.log("❌", text);
        context.report({
          loc: comment.loc,
          messageId: "invalid-pattern",
          data: { text, pattern: validPattern },
        });
      } else {
        console.log("✅", text);
      }
    });

    return {};
  },
};
