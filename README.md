# eslint-plugin-todo-with-label

[![node version](https://img.shields.io/node/v/eslint-plugin-todo-with-label.svg)](https://www.npmjs.com/package/eslint-plugin-todo-with-label)
[![npm version](https://badge.fury.io/js/eslint-plugin-todo-with-label.svg)](https://badge.fury.io/js/eslint-plugin-todo-with-label)
[![downloads count](https://img.shields.io/npm/dt/eslint-plugin-todo-with-label.svg)](https://www.npmjs.com/package/eslint-plugin-todo-with-label)
[![size](https://packagephobia.com/badge?p=eslint-plugin-todo-with-label)](https://packagephobia.com/result?p=eslint-plugin-todo-with-label)
[![license](https://img.shields.io/npm/l/eslint-plugin-todo-with-label.svg)](https://piecioshka.mit-license.org)
[![github-ci](https://github.com/piecioshka/eslint-plugin-todo-with-label/actions/workflows/testing.yml/badge.svg)](https://github.com/piecioshka/eslint-plugin-todo-with-label/actions/workflows/testing.yml)

🔨 ESLint plugin supports TODO comments with a label in parentheses

> Give a ⭐️ if this project helped you!

## Motivation

![](assets/screenshot.png)

When working with code, many times there will be a situation of creating a TODO
in the code to indicate that you need to perform some action here, such as writing an error handler.
In such situations, the creation of a TODO is understandable. On the other hand,
it often happens that such a comment in the code is for a long time.
Then people reading such code, who would like to solve the TODO comment,
lack information about the author, so that they can turn to him for more details.

If we use this plugin, we will force everyone creating a TODO comment to define the author in parentheses.
This way, we will always have a point of contact for the person we can ask for help.

## Features

- ✅ Validate format of TODOs in comments _(default valid format is `TODO(label): any text here`)_
- ✅ Supports passing a custom pattern and types
- ✅ Supports 8 comment types: `TODO`, `NOTE`, `COMMENT`, `FIXME`, `BUG`, `HACK`, `INFO`, `XXX`

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```bash
npm install -D eslint
```

Next, install `eslint-plugin-todo-with-label`:

```bash
npm install -D eslint-plugin-todo-with-label
```

## Usage

Add `todo-with-label` to the plugins section of your `.eslintrc` configuration file.<br/>
You can omit the `eslint-plugin-` prefix:

```javascript
module.exports = {
  // ...
  plugins: ['todo-with-label'],
  rules: {
    'todo-with-label/has-valid-pattern': 'error',
  }
};
```

## Options

The optional configuration for rule `todo-with-label/has-valid-pattern`:

- `types` examples:
  - `["TODO"]`
  - `["FOO", "BAR", "BAZ"]`

  Default `["TODO", "NOTE", "COMMENT", "FIXME", "BUG", "HACK", "INFO", "XXX"]`

- `pattern` examples:
  - `^TODO: (.*)$`
    - **valid**: `TODO: any text here`
  - `^TODO\\((\\w+)\\)$`
    - **valid**: `TODO(label)`
  - `^TODO\\((author:@\\w+)\\)\\: (.*)$`
    - **valid**: `TODO(author:@login): any text here`

  Default `pattern` looks as follows: `^TODO\\((\\w+)\\)\\: (.*)$`
    - **valid**: `TODO(label): any text here`

  ⚠️ **WARNING**: When you pass a pattern, it should be a string and has _escaped_ backslashes.

Example usage with options:

```js
module.exports = {
  // ...
  plugins: ['todo-with-label'],
  rules: {
    "todo-with-label/has-valid-pattern": [
      "error",
      {
        types: ["TODO"],
        pattern: "^TODO\\((author:@\\w+)\\)\\: (.*)$"
      },
    ],
  },
};
```

## Related

* [eslint-config-piecioshka](https://github.com/piecioshka/eslint-config-piecioshka)
* [export-eslint-config](https://github.com/piecioshka/export-eslint-config)

## License

[The MIT License](https://piecioshka.mit-license.org) @ 2023
