---
name: documentclassify
description: "Skill for the DocumentClassify area of svykhoa-admin. 13 symbols across 13 files."
---

# DocumentClassify

13 symbols | 13 files | Cohesion: 63%

## When to Use

- Working with code in `src/`
- Understanding how unwrapDetail, handleUserMenu, createAdmin work
- Modifying documentclassify-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/utils/apiResponse.ts` | unwrapDetail |
| `src/layouts/AppLayout.tsx` | handleUserMenu |
| `src/services/User/create.ts` | createAdmin |
| `src/services/DocumentClassify/update.ts` | updateDocumentClassify |
| `src/services/DocumentClassify/detail.ts` | getDocumentClassifyDetail |
| `src/services/DocumentClassify/create.ts` | createDocumentClassify |
| `src/services/Resource/uploadResource.ts` | uploadResource |
| `src/services/Auth/refresh.ts` | refresh |
| `src/services/Auth/logout.ts` | logout |
| `src/services/Document/uploadDocumentFile.ts` | uploadDocumentFile |

## Entry Points

Start here when exploring this area:

- **`unwrapDetail`** (Function) — `src/utils/apiResponse.ts:24`
- **`handleUserMenu`** (Function) — `src/layouts/AppLayout.tsx:80`
- **`createAdmin`** (Function) — `src/services/User/create.ts:13`
- **`updateDocumentClassify`** (Function) — `src/services/DocumentClassify/update.ts:14`
- **`getDocumentClassifyDetail`** (Function) — `src/services/DocumentClassify/detail.ts:13`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `unwrapDetail` | Function | `src/utils/apiResponse.ts` | 24 |
| `handleUserMenu` | Function | `src/layouts/AppLayout.tsx` | 80 |
| `createAdmin` | Function | `src/services/User/create.ts` | 13 |
| `updateDocumentClassify` | Function | `src/services/DocumentClassify/update.ts` | 14 |
| `getDocumentClassifyDetail` | Function | `src/services/DocumentClassify/detail.ts` | 13 |
| `createDocumentClassify` | Function | `src/services/DocumentClassify/create.ts` | 14 |
| `uploadResource` | Function | `src/services/Resource/uploadResource.ts` | 21 |
| `refresh` | Function | `src/services/Auth/refresh.ts` | 11 |
| `logout` | Function | `src/services/Auth/logout.ts` | 4 |
| `uploadDocumentFile` | Function | `src/services/Document/uploadDocumentFile.ts` | 6 |
| `createDocument` | Function | `src/services/Document/create.ts` | 18 |
| `getAnalyticsDashboard` | Function | `src/services/Analytics/dashboard.ts` | 12 |
| `handleUploadDocumentFile` | Function | `src/pages/authentication/DocumentPage/components/DocumentForm.tsx` | 177 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleUploadDocumentFile → ApiResponseError` | cross_community | 5 |
| `UserDetail → ApiResponseError` | cross_community | 4 |
| `DocumentForm → ApiResponseError` | cross_community | 4 |
| `DocumentLicenseDetail → ApiResponseError` | cross_community | 4 |
| `DocumentClassifyForm → ApiResponseError` | cross_community | 4 |
| `DocumentOrderDetail → ApiResponseError` | cross_community | 4 |
| `HandleUserMenu → ApiResponseError` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| SelectionVariants | 1 calls |

## How to Explore

1. `gitnexus_context({name: "unwrapDetail"})` — see callers and callees
2. `gitnexus_query({query: "documentclassify"})` — find related execution flows
3. Read key files listed above for implementation details
