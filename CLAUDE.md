# svykhoa-admin AI Configuration Guide

Welcome! This is the core configuration ruleset for Claude operating in the `svykhoa-admin` project.

## Core Tech Stack
- **Framework & Build**: React 19, Vite, TypeScript 5.9
- **Routing**: `react-router-dom` v7
- **Styling**: Tailwind CSS v4, Ant Design (`antd` v6)
- **State Management**: `zustand`
- **Forms & Validation**: `react-hook-form`, `zod`
- **HTTP/API**: `axios`
- **Charts**: `chart.js`, `react-chartjs-2`

## Global Design Rules
- All newly generated interactive UI elements MUST respect an 8px border radius using Tailwind (`rounded-lg`).
- Avoid heavy drop shadows. Default to soft, ambient shadows (`shadow-sm` or equivalent custom variable).
- Do not use hardcoded hex colors or arbitrary Tailwind color variables (e.g. `bg-blue-500`). Stick strictly to the global CSS variables defined in Tailwind config/index.css (e.g., `text-primary`, `bg-background`, `border-border`, etc.).

## Code Structure & Architecture
- **Pages**: Divided strictly by authentication context into `src/pages/authentication/` and `src/pages/unauthentication/`. The auth section is further split by functional domains (e.g., `DocumentPage`, `UserPage`).
- **Services**: All API queries via `axios` must be modularized into domain-specific folders inside `src/services/` (e.g., `src/services/User/`).
- **Store**: Minimal, focused state slices using `zustand` located in `src/store/`.
- **Typing & Formatting**: Follow existing `eslint.config.js` and `.prettierrc`. Enforce `import type` for TypeScript types (`@typescript-eslint/consistent-type-imports`).

