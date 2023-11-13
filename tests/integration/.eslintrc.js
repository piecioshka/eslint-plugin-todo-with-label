module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  plugins: ["todo-with-label"],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "todo-with-label/has-valid-pattern": [
      "error",
      // { pattern: "^TODO: (.*)$" },
      // { pattern: "^TODO\\((\\w+)\\)$" },
      { pattern: "^TODO\\((\\w+)\\)\\: (.*)$" }, // Default
      // { pattern: "^TODO\\((author:@\\w+)\\)\\: (.*)$" },
    ],
  },
};
