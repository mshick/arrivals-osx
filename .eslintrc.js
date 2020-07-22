module.exports = {
  extends: [
    `eslint:recommended`,
    `plugin:prettier/recommended`,
    `plugin:import/errors`,
    `plugin:import/warnings`,
  ],
  plugins: [`prettier`],
  parserOptions: {
    ecmaVersion: 2018,
  },
  env: {
    node: true,
    es6: true,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': [`.ts`],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  overrides: [
    {
      files: [`**/*.js`],
      extends: [
        `eslint:recommended`,
        `plugin:prettier/recommended`,
        `plugin:import/errors`,
        `plugin:import/warnings`,
      ],
      rules: {
        quotes: [`error`, `backtick`],
      },
    },
    {
      files: [`**/*.ts`],
      parser: `@typescript-eslint/parser`,
      plugins: [`@typescript-eslint`],
      extends: [
        `plugin:import/typescript`,
        `plugin:@typescript-eslint/recommended`,
        `prettier/@typescript-eslint`,
        `plugin:prettier/recommended`,
      ],
      parserOptions: {
        ecmaVersion: 2018,
        project: [`tsconfig.json`],
        sourceType: `module`,
        tsconfigRootDir: __dirname,
      },
      rules: {
        '@typescript-eslint/ban-ts-comment': `off`,
        '@typescript-eslint/no-explicit-any': `off`,
        '@typescript-eslint/quotes': [`error`, `backtick`],
      },
    },
    {
      files: [`**/*.d.ts`],
      rules: {
        '@typescript-eslint/no-unused-vars': `off`,
        '@typescript-eslint/no-explicit-any': `off`,
        '@typescript-eslint/ban-types': `off`,
      },
    },
    {
      files: [`*.md`],
      extends: [`plugin:prettier/recommended`],
      rules: {
        'no-trailing-spaces': `off`,
      },
    },
  ],
}
