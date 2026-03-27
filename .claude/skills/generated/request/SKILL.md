---
name: request
description: "Skill for the Request area of svykhoa-admin. 12 symbols across 9 files."
---

# Request

12 symbols | 9 files | Cohesion: 65%

## When to Use

- Working with code in `src/`
- Understanding how getDocumentOrderDetail, useUpdate, useRequest work
- Modifying request-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/pages/authentication/DashboardPage/DashboardPage.tsx` | formatDateKey, getTimeRange, fillDays, DashboardPage |
| `src/services/DocumentOrder/detail.ts` | getDocumentOrderDetail |
| `src/hooks/request/useUpdate.ts` | useUpdate |
| `src/hooks/request/useRequest.ts` | useRequest |
| `src/hooks/request/useDetail.ts` | useDetail |
| `src/hooks/request/useCreate.ts` | useCreate |
| `src/pages/authentication/UserPage/components/UserForm.tsx` | UserForm |
| `src/pages/authentication/DocumentOrderPage/components/DocumentOrderDetail.tsx` | DocumentOrderDetail |
| `src/pages/authentication/DocumentClassifyPage/components/DocumentClassifyForm.tsx` | DocumentClassifyForm |

## Entry Points

Start here when exploring this area:

- **`getDocumentOrderDetail`** (Function) — `src/services/DocumentOrder/detail.ts:13`
- **`useUpdate`** (Function) — `src/hooks/request/useUpdate.ts:6`
- **`useRequest`** (Function) — `src/hooks/request/useRequest.ts:8`
- **`useDetail`** (Function) — `src/hooks/request/useDetail.ts:16`
- **`useCreate`** (Function) — `src/hooks/request/useCreate.ts:6`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getDocumentOrderDetail` | Function | `src/services/DocumentOrder/detail.ts` | 13 |
| `useUpdate` | Function | `src/hooks/request/useUpdate.ts` | 6 |
| `useRequest` | Function | `src/hooks/request/useRequest.ts` | 8 |
| `useDetail` | Function | `src/hooks/request/useDetail.ts` | 16 |
| `useCreate` | Function | `src/hooks/request/useCreate.ts` | 6 |
| `DashboardPage` | Function | `src/pages/authentication/DashboardPage/DashboardPage.tsx` | 65 |
| `UserForm` | Function | `src/pages/authentication/UserPage/components/UserForm.tsx` | 14 |
| `DocumentOrderDetail` | Function | `src/pages/authentication/DocumentOrderPage/components/DocumentOrderDetail.tsx` | 30 |
| `DocumentClassifyForm` | Function | `src/pages/authentication/DocumentClassifyPage/components/DocumentClassifyForm.tsx` | 23 |
| `formatDateKey` | Function | `src/pages/authentication/DashboardPage/DashboardPage.tsx` | 26 |
| `getTimeRange` | Function | `src/pages/authentication/DashboardPage/DashboardPage.tsx` | 33 |
| `fillDays` | Function | `src/pages/authentication/DashboardPage/DashboardPage.tsx` | 44 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DocumentClassifyForm → ApiResponseError` | cross_community | 4 |
| `DocumentOrderDetail → ApiResponseError` | cross_community | 4 |
| `UserDetail → UseRequest` | cross_community | 3 |
| `DocumentForm → UseRequest` | cross_community | 3 |
| `DocumentLicenseDetail → UseRequest` | cross_community | 3 |
| `DocumentTable → UseRequest` | cross_community | 3 |
| `DocumentClassifyTable → UseRequest` | cross_community | 3 |
| `DocumentClassifyForm → UseRequest` | intra_community | 3 |
| `DashboardPage → FormatDateKey` | intra_community | 3 |
| `DocumentOrderDetail → UseRequest` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| DocumentClassify | 3 calls |
| Components | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getDocumentOrderDetail"})` — see callers and callees
2. `gitnexus_query({query: "request"})` — find related execution flows
3. Read key files listed above for implementation details
