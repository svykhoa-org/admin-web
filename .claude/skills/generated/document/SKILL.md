---
name: document
description: "Skill for the Document area of svykhoa-admin. 4 symbols across 4 files."
---

# Document

4 symbols | 4 files | Cohesion: 55%

## When to Use

- Working with code in `src/`
- Understanding how getUrlFileResource, updateDocument, getDocumentDetail work
- Modifying document-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/utils/getUrlFileResource.ts` | getUrlFileResource |
| `src/services/Document/update.ts` | updateDocument |
| `src/services/Document/detail.ts` | getDocumentDetail |
| `src/pages/authentication/DocumentPage/components/DocumentForm.tsx` | DocumentForm |

## Entry Points

Start here when exploring this area:

- **`getUrlFileResource`** (Function) — `src/utils/getUrlFileResource.ts:2`
- **`updateDocument`** (Function) — `src/services/Document/update.ts:14`
- **`getDocumentDetail`** (Function) — `src/services/Document/detail.ts:13`
- **`DocumentForm`** (Function) — `src/pages/authentication/DocumentPage/components/DocumentForm.tsx:56`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getUrlFileResource` | Function | `src/utils/getUrlFileResource.ts` | 2 |
| `updateDocument` | Function | `src/services/Document/update.ts` | 14 |
| `getDocumentDetail` | Function | `src/services/Document/detail.ts` | 13 |
| `DocumentForm` | Function | `src/pages/authentication/DocumentPage/components/DocumentForm.tsx` | 56 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DocumentForm → ApiResponseError` | cross_community | 4 |
| `DocumentForm → UseRequest` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Request | 3 calls |
| DocumentClassify | 2 calls |

## How to Explore

1. `gitnexus_context({name: "getUrlFileResource"})` — see callers and callees
2. `gitnexus_query({query: "document"})` — find related execution flows
3. Read key files listed above for implementation details
