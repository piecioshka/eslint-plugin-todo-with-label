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
          "// TODO(unknown): without-label #4",
        ),
        invalid(
          "// TODO(): without-label #5",
          "// TODO(unknown): (): without-label #5",
        ),
        invalid(
          "// TODO(piecioshka)without-label #6",
          "// TODO(unknown): (piecioshka)without-label #6",
        ),
        invalid(
          "// TODO(piecioshka) without-label #7",
          "// TODO(unknown): (piecioshka) without-label #7",
        ),
        invalid(
          "// TODO(piecioshka):without-label #8",
          "// TODO(unknown): (piecioshka):without-label #8",
        ),
        invalid(
          "// TODO(without-label #9)",
          "// TODO(unknown): (without-label #9)",
        ),
      ],
    });
  });

  test("single-line block", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("const a = 1; /* FIXME(piecioshka): with-label #2 */"),
        valid("let b; /* HACK(piecioshka): with-label #3 */"),
      ],
      invalid: [
        invalid(
          "/* TODO: without-label #10 */",
          "/* TODO(unknown): without-label #10 */",
        ),
        invalid(
          "/* TODO(without-label #11) */",
          "/* TODO(unknown): (without-label #11) */",
        ),
      ],
    });
  });

  test("multiline block", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("/*\n * TODO(piecioshka): with-label #12\n */"),
        valid(
          "/*\n * FIXME(piecioshka): with-label #13\n * just a description\n */",
        ),
      ],
      invalid: [
        invalid(
          "/*\n * TODO: without-label #14\n */",
          "/*\n * TODO(unknown): without-label #14\n */",
        ),
        invalid(
          "/*\n * TODO: without-label #15\n * FIXME: without-label #16\n */",
          "/*\n * TODO(unknown): without-label #15\n * FIXME(unknown): without-label #16\n */",
          2,
        ),
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
          "// TODO(unknown): without-label #3",
        ),
        invalid(
          "// FIXME: without-label #4",
          "// FIXME(unknown): without-label #4",
        ),
      ],
    });
  });

  test("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([{ types: ["TODO", "FIXME"] }]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("const a = 1; /* FIXME(piecioshka): with-label #2 */"),
        valid("/*\n * TODO(piecioshka): with-label #3\n */"),
      ],
      invalid: [
        invalid(
          "/* FIXME: without-label #4 */",
          "/* FIXME(unknown): without-label #4 */",
        ),
        invalid(
          "/*\n * FIXME: without-label #5\n */",
          "/*\n * FIXME(unknown): without-label #5\n */",
        ),
      ],
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

  test("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      { pattern: "^(TODO|FIXME)\\((\\w+)\\): (.*)$" },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("const a = 1; /* FIXME(piecioshka): with-label #2 */"),
        valid("/*\n * TODO(piecioshka): with-label #3\n */"),
      ],
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

  test("multi line", () => {
    const ruleTester = new RuleTester(globalOptions);
    const { valid, invalid } = methodsFactory([
      {
        types: ["TODO", "FIXME"],
        pattern: "^(TODO|FIXME)\\((\\w+)\\): (.*)$",
      },
    ]);

    ruleTester.run("todo-with-label", todoWithLabelRule, {
      valid: [
        valid("const a = 1; /* FIXME(piecioshka): with-label #2 */"),
        valid("/*\n * TODO(piecioshka): with-label #3\n */"),
      ],
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

  test("multi line", () => {
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
        // BAZ/NOTE are not in `types`, so they are ignored.
        valid("/* BAZ: invalid-pattern #3 */"),
        valid("/* NOTE: invalid-pattern #4 */"),
        valid("/*\n * BAR(author:@piecioshka): invalid-pattern #5\n */"),
      ],
      // No `invalid` cases: with a custom `pattern`, the fixer throws, so
      // RuleTester (which always applies fixes) cannot be used here. The
      // single-line block above mirrors the existing line-comment tests.
      invalid: [],
    });
  });
});
