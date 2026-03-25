---
name: Design System Rules
description: Rules for generating visual elements, colors, shapes, and tailwind classes
---

# Design System Rules

When generating code, always adhere to the following design system conventions for the svykhoa-admin project. 
This project leverages **Tailwind CSS v4** combined with **Ant Design (v6)** components.

## Shape & Radii
- Every container, button, card, and interactive element should have a precise **8px border radius**.
- In Tailwind CSS, consistently use the `rounded-lg` utility.
- When configuring Ant Design Theme within the `ConfigProvider`, ensure `borderRadius` maps to 8px.
- Do not mix border radii (e.g., no `rounded-sm` next to `rounded-lg`).

## Shadows & Depth
- Elements that hover or sit above the background (cards, modals, dropdowns) should use **soft, ambient shadows**.
- Use Tailwind's `shadow-sm` or a predefined custom shadow in the tailwind configuration.
- Avoid heavy, dark shadows (never use `shadow-xl` or `shadow-2xl` unless specifically building a high-elevation element like a critical alert dialog).

## Colors
- The project relies on a semantic global color palette defined through CSS vars in `src/index.css`.
- Core references: `--color-primary`, `--color-danger`, `--color-success`, `--color-warning`.
- Always use these CSS variables or semantic Tailwind classes mapped to them (e.g., `text-primary`, `text-danger`).
- **Forbidden:** Never hardcode hex values (`#FF0000`) or standard palette colors (`text-red-500`, `bg-blue-600`) unless explicitly building underlying theme definitions.

## Combining Tailwind and Ant Design
- Use Ant Design (`antd`) components for complex structures (Tables, Forms, Selects).
- Use Tailwind for layout (flex, grid, spacing, sizing) wrapper elements.
