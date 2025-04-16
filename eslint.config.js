import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

// Create a FlatCompat instance with required parameters
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended
})

export default [
  {
    // Only ignore specific directories/files, but allow examples
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '**/*.d.ts'
    ]
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ),
  {
    // Explicitly include examples directory files
    files: ['**/*.ts', '**/*.js', 'examples/**/*.js', 'examples/**/*.ts', 'examples/**/*.html'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // Custom rules
      'semi': ['error', 'never'], // No semicolons
      'quotes': ['error', 'single'], // Single quotes
      'indent': ['error', 2], // 2 spaces indentation
      'comma-dangle': ['error', 'never'], // No trailing commas
      'no-trailing-spaces': 'error', // No trailing spaces
      'eol-last': ['error', 'always'], // End of file newline
      'no-unused-vars': 'warn', // Warn for unused variables
      'no-console': 'warn', // Warn for console.log
      'object-curly-spacing': ['error', 'always'], // Spaces inside object braces
      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'off', // No need to specify function return type
      '@typescript-eslint/no-explicit-any': 'warn', // Warn for any type usage
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }] // Warn for unused vars, ignore args starting with _
    }
  }
]
