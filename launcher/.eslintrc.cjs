module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'prettier'],
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    '@typescript-eslint/no-explicit-any': ['warn'],
    '@typescript-eslint/no-floating-promises': 'error',
    'no-console': ['warn', { allow: ['error'] }]
  },
  overrides: [
    {
      files: ['app/renderer/**/*.{ts,tsx}'],
      rules: {
        'react/jsx-key': 'off'
      }
    }
  ]
};
