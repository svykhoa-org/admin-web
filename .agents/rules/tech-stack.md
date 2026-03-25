---
name: Tech Stack Rules
description: Defines current libraries and dependencies to avoid introducing redundant or conflicting packages
---

# Approved Tech Stack

To prevent bloating `package.json` with overlapping utilities, the following primary packages are already established and must be reused for their respective domains:

- **Framework**: `react` (v19)
- **Build Tool**: `vite`
- **Language**: `typescript`
- **Styling**: `@tailwindcss/vite` (v4), `autoprefixer`
- **UI Library**: `antd` (v6)
- **Routing**: `react-router-dom` (v7)
- **Form Management**: `react-hook-form`
- **Validation**: `zod`, `@hookform/resolvers`
- **HTTP Client**: `axios`
- **State Management**: `zustand`
- **Charting**: `chart.js`, `react-chartjs-2`

Do not introduce equivalent tools (like `formik`, `yup`, `react-query` if zustand handles it, or `redux`) without rigorous justification.
