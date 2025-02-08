import { describe, test } from "vitest";
import { RuleTester } from "eslint";

const todoWithLabelRule = require("./todo-with-label");

/**
 * @param {any} options
 * @returns {(code: string) => RuleTester.ValidTestCase}
 */
const validFactory = (options) => (code) => ({ code, options });

/**
 * @param {any} options
 * @returns {(code: RuleTester.InvalidTestCase['code'], output: RuleTester.InvalidTestCase['output'], errors: RuleTester.InvalidTestCase['errors'] = 1) => RuleTester.InvalidTestCase}
 */
const invalidFactory =
  (options) =>
  (code, output, errors = 1) => ({
    code,
    options,
    output,
    errors,
  });

const methodsFactory = (ruleOptions) => {
  const valid = validFactory(ruleOptions);
  const invalid = invalidFactory(ruleOptions);
  return { valid, invalid };
};

/**
 * @type {import('eslint').Linter.Config}
 */
const globalOptions = { parserOptions: { ecmaVersion: 2015 } };

describe("no options", () => {
  test("single line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("// TODO(piecioshka): without-label #1"),
        valid("// TODO(piecioshka) : without-label #2"),
        valid("var c = 4; // This is not TODO"),
      ],
      invalid: [
        invalid(
          "// TODO: without-label #4",
          "// TODO(unknown): without-label #4"
        ),
        invalid(
          "// TODO(): without-label #5",
          "// TODO(unknown): (): without-label #5"
        ),
        invalid(
          "// TODO(piecioshka)without-label #6",
          "// TODO(unknown): (piecioshka)without-label #6"
        ),
        invalid(
          "// TODO(piecioshka) without-label #7",
          "// TODO(unknown): (piecioshka) without-label #7"
        ),
        invalid(
          "// TODO(piecioshka):without-label #8",
          "// TODO(unknown): (piecioshka):without-label #8"
        ),
        invalid(
          "// TODO(without-label #9)",
          "// TODO(unknown): (without-label #9)"
        ),
      ],
    });
  });

  test.todo("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("const a = 1; /* FIXME(piecioshka): without-label #2 */"),
        valid("let b; /* HACK(piecioshka): without-label #3 */"),
      ],
      invalid: [
        invalid("const a = 1; /* TODO(without-label #10) */"),
        invalid("let b; /* TODO(without-label #11) */"),
      ],
    });
  });
});

describe("with options: types", () => {
  test("single line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([{ types: ["TODO", "FIXME"] }]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [valid("// TODO(piecioshka): with-label #1")],
      invalid: [
        invalid(
          "// TODO: without-label #3",
          "// TODO(unknown): without-label #3"
        ),
        invalid(
          "// FIXME: without-label #4",
          "// FIXME(unknown): without-label #4"
        ),
      ],
    });
  });

  test.todo("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([{ types: ["TODO", "FIXME"] }]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [valid("const a = 1; /* FIXME(piecioshka): with-label #2 */")],
      invalid: [],
    });
  });
});

describe("with options: pattern", () => {
  test("single line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      { pattern: "^(TODO|FIXME)\\((\\w+)\\): (.*)$" },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [valid("// TODO(piecioshka): with-label #1")],
      invalid: [
        // invalid("// TODO: without-label #1", "// TODO: without-label #1"),
        // invalid("// FIXME: without-label #2", "// FIXME: without-label #2"),
      ],
    });
  });

  test.todo("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      { pattern: "^(TODO|FIXME)\\((\\w+)\\): (.*)$" },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [valid("const a = 1; /* FIXME(piecioshka): with-label #2 */")],
      invalid: [],
    });
  });
});

describe("with options: types and pattern", () => {
  test("single line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      {
        types: ["TODO", "FIXME"],
        pattern: "^(TODO|FIXME)\\((\\w+)\\): (.*)$",
      },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [valid("// TODO(piecioshka): with-label #1")],
      invalid: [
        // invalid("// TODO: without-label #2", "// TODO: without-label #2"),
        // invalid("// FIXME: without-label #3", "// FIXME: without-label #3"),
      ],
    });
  });

  test.todo("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      {
        types: ["TODO", "FIXME"],
        pattern: "^(TODO|FIXME)\\((\\w+)\\): (.*)$",
      },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [valid("const a = 1; /* FIXME(piecioshka): with-label #2 */")],
      invalid: [],
    });
  });
});

describe("enable options: types, pattern", () => {
  test("single line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      {
        types: ["FOO", "BAR"],
        pattern: "^(FOO|BAR)\\((author:@\\w+)\\)\\: (.*)$",
      },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [valid("// FOO(author:@piecioshka): invalid-pattern #1")],
      invalid: [
        // invalid(
        //   "// FOO(@piecioshka): invalid-pattern #2",
        //   "// FOO(@piecioshka): invalid-pattern #2"
        // ),
      ],
    });
  });

  test.todo("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      {
        types: ["FOO", "BAR"],
        pattern: "^(FOO|BAR)\\((author:@\\w+)\\)\\: (.*)$",
      },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("/* BAR(author:@piecioshka): invalid-pattern #2 */"),
        valid("/* BAZ: invalid-pattern #3 */"),
        valid("/* NOTE: invalid-pattern #4 */"),
      ],
      invalid: [invalid("/* BAR(@piecioshka): invalid-pattern #6 */", "")],
    });
  });
});
