---
name: components
description: "Skill for the Components area of svykhoa-admin. 34 symbols across 21 files."
---

# Components

34 symbols | 21 files | Cohesion: 71%

## When to Use

- Working with code in `src/`
- Understanding how isApiResponseError, onSubmit, handleUpdateStatus work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/pages/authentication/UserPage/components/UserTable.tsx` | handleUpdateStatus, openConfirmUpdateStatus, resolvePlatform, UserTable |
| `src/pages/authentication/UserPage/components/UserDetail.tsx` | resolvePlatform, UserDetail, handleToggleStatus, openConfirmToggleStatus |
| `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseTable.tsx` | DocumentLicenseTable, handleRevoke, handleUnrevoke, openRevokeModal |
| `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseDetail.tsx` | handleRevoke, openRevokeModal, handleUnrevoke |
| `src/pages/authentication/DocumentPage/components/DocumentTable.tsx` | handleConfirmDelete, DocumentTable |
| `src/pages/authentication/DocumentClassifyPage/components/DocumentClassifyTable.tsx` | handleConfirmDelete, DocumentClassifyTable |
| `src/utils/apiResponse.ts` | isApiResponseError |
| `src/pages/unauthentication/LoginPage.tsx` | onSubmit |
| `src/pages/authentication/UserPage/components/UserForm.tsx` | onSubmit |
| `src/pages/authentication/DocumentPage/components/DocumentForm.tsx` | onSubmit |

## Entry Points

Start here when exploring this area:

- **`isApiResponseError`** (Function) — `src/utils/apiResponse.ts:16`
- **`onSubmit`** (Function) — `src/pages/unauthentication/LoginPage.tsx:34`
- **`handleUpdateStatus`** (Function) — `src/pages/authentication/UserPage/components/UserTable.tsx:85`
- **`openConfirmUpdateStatus`** (Function) — `src/pages/authentication/UserPage/components/UserTable.tsx:107`
- **`onSubmit`** (Function) — `src/pages/authentication/UserPage/components/UserForm.tsx:29`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `isApiResponseError` | Function | `src/utils/apiResponse.ts` | 16 |
| `onSubmit` | Function | `src/pages/unauthentication/LoginPage.tsx` | 34 |
| `handleUpdateStatus` | Function | `src/pages/authentication/UserPage/components/UserTable.tsx` | 85 |
| `openConfirmUpdateStatus` | Function | `src/pages/authentication/UserPage/components/UserTable.tsx` | 107 |
| `onSubmit` | Function | `src/pages/authentication/UserPage/components/UserForm.tsx` | 29 |
| `handleConfirmDelete` | Function | `src/pages/authentication/DocumentPage/components/DocumentTable.tsx` | 83 |
| `onSubmit` | Function | `src/pages/authentication/DocumentPage/components/DocumentForm.tsx` | 122 |
| `handleConfirmDelete` | Function | `src/pages/authentication/DocumentClassifyPage/components/DocumentClassifyTable.tsx` | 62 |
| `onSubmit` | Function | `src/pages/authentication/DocumentClassifyPage/components/DocumentClassifyForm.tsx` | 73 |
| `handleRevoke` | Function | `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseDetail.tsx` | 55 |
| `openRevokeModal` | Function | `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseDetail.tsx` | 70 |
| `handleUnrevoke` | Function | `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseDetail.tsx` | 104 |
| `formatTimestamp` | Function | `src/utils/time/formatTimestamp.ts` | 5 |
| `removeDocumentClassify` | Function | `src/services/DocumentClassify/remove.ts` | 12 |
| `removeDocument` | Function | `src/services/Document/remove.ts` | 10 |
| `useList` | Function | `src/hooks/request/useList.ts` | 44 |
| `useDelete` | Function | `src/hooks/request/useDelete.ts` | 15 |
| `DocumentClassifySelect` | Function | `src/components/SelectionVariants/DocumentClassifySelect.tsx` | 16 |
| `DocumentTable` | Function | `src/pages/authentication/DocumentPage/components/DocumentTable.tsx` | 30 |
| `DocumentOrderTable` | Function | `src/pages/authentication/DocumentOrderPage/components/DocumentOrderTable.tsx` | 52 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UserTable → ApiResponseError` | cross_community | 4 |
| `DocumentLicenseTable → ApiResponseError` | cross_community | 4 |
| `UserDetail → ApiResponseError` | cross_community | 4 |
| `DocumentTable → ApiResponseError` | cross_community | 4 |
| `DocumentClassifyTable → ApiResponseError` | cross_community | 4 |
| `DocumentOrderTable → ApiResponseError` | cross_community | 4 |
| `UserTable → BuildQuery` | cross_community | 3 |
| `DocumentLicenseTable → BuildQuery` | cross_community | 3 |
| `UserDetail → UseRequest` | cross_community | 3 |
| `DocumentTable → BuildQuery` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| DocumentClassify | 5 calls |
| Request | 5 calls |
| SelectionVariants | 5 calls |
| DocumentLicense | 2 calls |

## How to Explore

1. `gitnexus_context({name: "isApiResponseError"})` — see callers and callees
2. `gitnexus_query({query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
