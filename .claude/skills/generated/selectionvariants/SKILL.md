---
name: selectionvariants
description: "Skill for the SelectionVariants area of svykhoa-admin. 10 symbols across 9 files."
---

# SelectionVariants

10 symbols | 9 files | Cohesion: 81%

## When to Use

- Working with code in `src/`
- Understanding how buildQuery, unwrapList, listUser work
- Modifying selectionvariants-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/utils/apiResponse.ts` | ApiResponseError, unwrapList |
| `src/utils/buildQuery.ts` | buildQuery |
| `src/services/User/list.ts` | listUser |
| `src/services/DocumentLicense/list.ts` | listDocumentLicense |
| `src/services/DocumentClassify/list.ts` | listDocumentClassify |
| `src/services/DocumentOrder/list.ts` | listDocumentOrder |
| `src/services/Document/list.ts` | listDocument |
| `src/components/SelectionVariants/UserSelect.tsx` | UserSelect |
| `src/components/SelectionVariants/DocumentSelect.tsx` | DocumentSelect |

## Entry Points

Start here when exploring this area:

- **`buildQuery`** (Function) — `src/utils/buildQuery.ts:85`
- **`unwrapList`** (Function) — `src/utils/apiResponse.ts:35`
- **`listUser`** (Function) — `src/services/User/list.ts:14`
- **`listDocumentLicense`** (Function) — `src/services/DocumentLicense/list.ts:17`
- **`listDocumentClassify`** (Function) — `src/services/DocumentClassify/list.ts:18`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiResponseError` | Class | `src/utils/apiResponse.ts` | 6 |
| `buildQuery` | Function | `src/utils/buildQuery.ts` | 85 |
| `unwrapList` | Function | `src/utils/apiResponse.ts` | 35 |
| `listUser` | Function | `src/services/User/list.ts` | 14 |
| `listDocumentLicense` | Function | `src/services/DocumentLicense/list.ts` | 17 |
| `listDocumentClassify` | Function | `src/services/DocumentClassify/list.ts` | 18 |
| `listDocumentOrder` | Function | `src/services/DocumentOrder/list.ts` | 14 |
| `listDocument` | Function | `src/services/Document/list.ts` | 14 |
| `UserSelect` | Function | `src/components/SelectionVariants/UserSelect.tsx` | 17 |
| `DocumentSelect` | Function | `src/components/SelectionVariants/DocumentSelect.tsx` | 17 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleUploadDocumentFile → ApiResponseError` | cross_community | 5 |
| `UserTable → ApiResponseError` | cross_community | 4 |
| `DocumentLicenseTable → ApiResponseError` | cross_community | 4 |
| `UserDetail → ApiResponseError` | cross_community | 4 |
| `DocumentForm → ApiResponseError` | cross_community | 4 |
| `DocumentLicenseDetail → ApiResponseError` | cross_community | 4 |
| `DocumentTable → ApiResponseError` | cross_community | 4 |
| `DocumentClassifyTable → ApiResponseError` | cross_community | 4 |
| `DocumentClassifyForm → ApiResponseError` | cross_community | 4 |
| `DocumentOrderTable → ApiResponseError` | cross_community | 4 |

## How to Explore

1. `gitnexus_context({name: "buildQuery"})` — see callers and callees
2. `gitnexus_query({query: "selectionvariants"})` — find related execution flows
3. Read key files listed above for implementation details
