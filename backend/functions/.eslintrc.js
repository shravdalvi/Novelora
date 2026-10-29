module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '.eslintrc.js',
  ],
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'import/no-unresolved': 0,
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
  },
};

