---
name: Formatting and Linter Rules
description: Strict guidelines on formatting, linting, and TypeScript checks
---

# Check & Formatting Styles

Follow these strict syntax and linter rules as outlined by the project config:

## ESLint & Prettier
- Formatting is entirely delegated to `prettier` (via `eslint-plugin-prettier`).
- If you edit a file, match 2-spaces, single quotes, and other standard prettier defaults inferred in the environment.

## TypeScript Standards
- **Enforced Type Imports**: You MUST use type imports when bringing definitions across files.
  - Good: `import type { User } from './types'`
  - Bad: `import { User } from './types'`
  - Enforced by rule: `@typescript-eslint/consistent-type-imports`
- Avoid `any`. Treat strict typing as mandatory.

## React Refresh
- The linter enforces `react-refresh/only-export-components`. Ensure that route files or page entrypoints only export React components or constant configuration, not arbitrary mutable variables.
