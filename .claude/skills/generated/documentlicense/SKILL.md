---
name: documentlicense
description: "Skill for the DocumentLicense area of svykhoa-admin. 4 symbols across 4 files."
---

# DocumentLicense

4 symbols | 4 files | Cohesion: 43%

## When to Use

- Working with code in `src/`
- Understanding how unrevokeDocumentLicense, revokeDocumentLicense, getDocumentLicenseDetail work
- Modifying documentlicense-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/DocumentLicense/unrevoke.ts` | unrevokeDocumentLicense |
| `src/services/DocumentLicense/revoke.ts` | revokeDocumentLicense |
| `src/services/DocumentLicense/detail.ts` | getDocumentLicenseDetail |
| `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseDetail.tsx` | DocumentLicenseDetail |

## Entry Points

Start here when exploring this area:

- **`unrevokeDocumentLicense`** (Function) — `src/services/DocumentLicense/unrevoke.ts:13`
- **`revokeDocumentLicense`** (Function) — `src/services/DocumentLicense/revoke.ts:14`
- **`getDocumentLicenseDetail`** (Function) — `src/services/DocumentLicense/detail.ts:13`
- **`DocumentLicenseDetail`** (Function) — `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseDetail.tsx:27`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `unrevokeDocumentLicense` | Function | `src/services/DocumentLicense/unrevoke.ts` | 13 |
| `revokeDocumentLicense` | Function | `src/services/DocumentLicense/revoke.ts` | 14 |
| `getDocumentLicenseDetail` | Function | `src/services/DocumentLicense/detail.ts` | 13 |
| `DocumentLicenseDetail` | Function | `src/pages/authentication/DocumentLicensePage/components/DocumentLicenseDetail.tsx` | 27 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DocumentLicenseDetail → ApiResponseError` | cross_community | 4 |
| `DocumentLicenseDetail → UseRequest` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| DocumentClassify | 3 calls |
| Request | 2 calls |
| Components | 1 calls |

## How to Explore

1. `gitnexus_context({name: "unrevokeDocumentLicense"})` — see callers and callees
2. `gitnexus_query({query: "documentlicense"})` — find related execution flows
3. Read key files listed above for implementation details
