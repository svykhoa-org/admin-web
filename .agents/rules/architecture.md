---
name: Project Architecture Rules
description: Rules for project structure, router config, state management, and services
---

# Architecture & Directories Rules

Follow these structural guidelines to keep the app organized and consistent with existing patterns.

## 1. Routing & Pages (`src/router/`, `src/pages/`)
- Routing utilizes `react-router-dom`'s `createBrowserRouter`.
- Explicit separation exists between authenticated and unauthenticated pages via the `ProtectedRoute` wrapper.
- **Pages Directory**:
  - `src/pages/authentication/[DomainName]Page/`: Groups all CRUD flows for a specific feature (e.g., `DocumentCreatePage`, `DocumentListPage`).
  - `src/pages/unauthentication/`: Login, reset password, 404 pages.

## 2. API Integration (`src/services/`)
- The project uses `axios` as the HTTP client.
- Create feature-specific subdirectories under `src/services/` (e.g., `src/services/Auth/`, `src/services/Document/`).
- Service functions should encapsulate API endpoints, query parsing, and token management where needed.

## 3. Global State (`src/store/`)
- Utilize `zustand` for any necessary global state (e.g., `authStore.ts`).
- Avoid large monolithic stores; split zustand stores by domain/feature.

## 4. Components (`src/components/`, `src/layouts/`)
- Place generic UI elements, variants, or base overrides in `src/components/` (e.g., `ModalVariants`, `UploadFileResource`).
- `AppLayout.tsx` handles the main authenticated frame structure.
