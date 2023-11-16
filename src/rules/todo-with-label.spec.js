import { test } from "vitest";
import { RuleTester } from "eslint";

const todoWithLabelRule = require("./todo-with-label");
const validFactory = (options) => (code) => ({ code, options });
const invalidFactory = (options) => (code) => ({
  code,
  options,
  output: code,
  errors: 1,
});
const globalOptions = { parserOptions: { ecmaVersion: 2015 } };

test("case: without-label", () => {
  const ruleTester = new RuleTester(globalOptions);
  const invalid = invalidFactory([]);
  ruleTester.run("todo-with-label", todoWithLabelRule, {
    valid: [
      "// TODO(piecioshka): without-label #1",
      "const a = 1; /* FIXME(piecioshka): without-label #2 */",
      "let b; /* HACK(piecioshka): without-label #3 */",
      "var c = 4; // This is not TODO",
    ],
    invalid: [
      invalid("// TODO: without-label #4"),
      invalid("// TODO(): without-label #5"),
      invalid("// TODO(piecioshka)without-label #6"),
      invalid("// TODO(piecioshka) without-label #7"),
      invalid("// TODO(piecioshka):without-label #8"),
      invalid("// TODO(without-label #9)"),
      invalid("const a = 1; /* TODO(without-label #10) */"),
      invalid("let b; /* TODO(without-label #11) */"),
    ],
  });
});

test("case: invalid-pattern", () => {
  const ruleTester = new RuleTester(globalOptions);
  const ruleOptions = [
    { pattern: "^(XXX|FIXME)\\((author:@\\w+)\\)\\: (.*)$" },
  ];
  const valid = validFactory(ruleOptions);
  const invalid = invalidFactory(ruleOptions);

  ruleTester.run("todo-with-label", todoWithLabelRule, {
    valid: [
      valid("// XXX(author:@piecioshka): invalid-pattern #1"),
      valid("/* FIXME(author:@piecioshka): invalid-pattern #2 */"),
    ],
    invalid: [
      invalid("// XXX(@piecioshka): invalid-pattern #3"),
      invalid("/* FIXME(@piecioshka): invalid-pattern #4 */"),
    ],
  });
});
