module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['security', '@typescript-eslint'],
  extends: [
    'plugin:security/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // SQL injection prevention
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-sql-literal-injection': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  overrides: [
    {
      // Test files often need more flexibility
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'security/detect-object-injection': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};