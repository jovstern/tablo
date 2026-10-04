import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results', '.claude', '.agents'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  {
    languageOptions: { globals: globals.browser },
  },
  {
    // ADR 0001: only the engine adapter may talk to the engine.
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    ignores: ['src/engine/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@excalidraw/*'],
              message: 'Go through the engine adapter in src/engine instead.',
            },
          ],
        },
      ],
    },
  },
  prettier,
)
