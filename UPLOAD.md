# Asset Module

Centralized file management module. All file uploads in the system go through this module and receive an `assetId` that business modules store as a reference. The module is storage-agnostic — the underlying provider (MinIO, S3, R2) can be swapped without touching any business logic.

---

## Table of Contents

1. [Architecture](#architecture)
2. [File Structure](#file-structure)
3. [Data Model](#data-model)
4. [Configuration](#configuration)
5. [Upload Strategy Guide](#upload-strategy-guide)
6. [API Reference](#api-reference)
7. [Inter-Module Integration](#inter-module-integration)
8. [Storage Key Layout](#storage-key-layout)
9. [Session Management (Redis)](#session-management-redis)
10. [Adding a Storage Provider](#adding-a-storage-provider)
11. [Security Model](#security-model)

---

## Architecture

```
HTTP Request
    │
    ▼
AssetController          ← HTTP layer: routing, auth guards, file interceptors
    │
    ▼
AssetService             ← Business logic: type detection, key building, status transitions
    ├── AssetStorageService   ← Storage facade: bucket resolution, URL normalization
    │       └── IStorageAdapter  ← Port (interface)
    │               └── MinioAdapter  ← Adapter (current implementation)
    ├── RedisService          ← Multipart session persistence (TTL-based)
    └── ImageProcessor        ← EXIF/dimension extraction via sharp
```

**Design principles:**

- The API is organized by **upload mechanism** (server-buffer / presigned / multipart), not by file type.
- `AssetType` is auto-detected from MIME type — clients never declare it explicitly.
- The module is fully self-contained; it does not depend on any other business module.
- Swapping the storage provider requires only changing the adapter registered in `asset.module.ts`.

---

## File Structure

```
src/libs/asset/
├── asset.constants.ts              # TTL and chunk size constants
├── asset.controller.ts             # REST endpoints
├── asset.module.ts                 # NestJS @Global() module
├── asset.service.ts                # Public API consumed by other modules
├── dto/
│   ├── complete-multipart-upload.dto.ts
│   ├── init-multipart-upload.dto.ts
│   ├── refresh-parts.dto.ts
│   └── request-presigned-upload.dto.ts
├── entities/
│   └── asset.entity.ts             # TypeORM entity + enums
├── interfaces/
│   ├── asset-metadata.interface.ts # Typed metadata per AssetType
│   ├── storage.interface.ts        # CompletedPart, StorageUploadResult
│   └── upload-session.interface.ts # Redis session shape
├── processors/
│   └── image.processor.ts          # sharp-based metadata extraction
└── storage/
    ├── adapters/
    │   ├── minio.adapter.ts
    │   └── storage-adapter.interface.ts  # IStorageAdapter contract
    ├── asset-storage.service.ts          # Facade over IStorageAdapter
    └── storage.token.ts                  # DI injection token
```

---

## Data Model

### `Asset` Entity

| Column         | Type                   | Nullable | Description                                      |
| -------------- | ---------------------- | -------- | ------------------------------------------------ |
| `id`           | `uuid`                 | No       | Primary key                                      |
| `type`         | `enum AssetType`       | No       | Auto-detected from MIME                          |
| `status`       | `enum AssetStatus`     | No       | Lifecycle state (default: `PENDING`)             |
| `originalName` | `varchar(500)`         | No       | Original filename from the client                |
| `mimetype`     | `varchar(100)`         | No       | MIME type (e.g. `image/jpeg`, `video/mp4`)       |
| `size`         | `bigint`               | Yes      | File size in bytes; null until upload completes  |
| `key`          | `varchar(500)`         | Yes      | Storage object key; null until upload is started |
| `bucket`       | `varchar(100)`         | Yes      | Storage bucket name                              |
| `metadata`     | `jsonb`                | No       | Type-specific metadata (see below)               |
| `visibility`   | `enum AssetVisibility` | No       | `PRIVATE` (default) or `PUBLIC`                  |
| `error`        | `text`                 | Yes      | Error message when `status = FAILED`             |
| `uploadedBy`   | `uuid`                 | Yes      | User ID of the uploader                          |
| `deletedAt`    | `timestamp`            | Yes      | Soft-delete timestamp (inherited from base)      |

### Enumerations

#### `AssetType`

| Value      | MIME pattern  | Allowed extensions                                 |
| ---------- | ------------- | -------------------------------------------------- |
| `IMAGE`    | `image/*`     | `jpg`, `jpeg`, `png`, `webp`                       |
| `VIDEO`    | `video/*`     | `mp4`                                              |
| `DOCUMENT` | _(all other)_ | `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx` |

> `AssetType` is derived automatically from the MIME type at upload time. Clients do not send this field.

#### `AssetStatus` — Lifecycle

```
PENDING ──► UPLOADING ──► PROCESSING ──► READY
                │                ▼
                └──────────► FAILED
```

| Status       | Meaning                                                        |
| ------------ | -------------------------------------------------------------- |
| `PENDING`    | Record created, upload not yet started                         |
| `UPLOADING`  | Presigned PUT or multipart session is active                   |
| `PROCESSING` | Upload complete; waiting for post-processing (transcode, etc.) |
| `READY`      | File is accessible                                             |
| `FAILED`     | Upload or processing failed                                    |

> **Server-side uploads** (`POST /assets/upload`, `POST /assets/upload/bulk`) bypass `UPLOADING` and `PROCESSING` — the server controls the entire lifecycle synchronously, so the record goes directly `PENDING → READY`.

#### `AssetVisibility`

| Value     | Meaning                                |
| --------- | -------------------------------------- |
| `PRIVATE` | Access requires a signed URL (default) |
| `PUBLIC`  | Intended for future CDN-served assets  |

### Metadata Shapes

Stored in the `metadata` jsonb column. The shape depends on `AssetType`.

**`ImageAssetMetadata`**

```typescript
{
  width: number;       // pixels
  height: number;      // pixels
  format: 'jpeg' | 'png' | 'webp' | 'gif';
  blurHash?: string;   // optional perceptual hash for placeholder
}
```

**`VideoAssetMetadata`**

```typescript
{
  duration?: number;         // seconds
  width?: number;            // pixels
  height?: number;           // pixels
  thumbnailKey?: string;     // storage key of generated thumbnail
  hlsKey?: string;           // storage key of HLS master playlist (m3u8)
  hlsVariants?: HlsVariant[];
}

interface HlsVariant {
  label: string;    // e.g. "1080p"
  width: number;
  height: number;
  bitrate: number;  // bits per second
  key: string;      // storage key of the variant playlist
}
```

**`DocumentAssetMetadata`**

```typescript
{
  language?: string;    // ISO 639-1 (e.g. "vi", "en")
  isScanned?: boolean;  // true if the document is a scanned image PDF
}
```

---

## Configuration

```env
# Storage provider selection
STORAGE_PROVIDER=minio

# MinIO / S3-compatible credentials
MINIO_ENDPOINT=http://localhost:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET_NAME=svykhoa

# Optional: public proxy URL (e.g. nginx in front of MinIO)
# When set, all signed URLs are rewritten to use this base.
# Leave empty in local development.
MINIO_PUBLIC_ENDPOINT=
```

| Variable                | Required | Default           | Description                                   |
| ----------------------- | -------- | ----------------- | --------------------------------------------- |
| `STORAGE_PROVIDER`      | Yes      | —                 | Currently only `minio` is supported           |
| `MINIO_ENDPOINT`        | Yes      | —                 | Internal MinIO URL (server-to-server)         |
| `MINIO_ROOT_USER`       | Yes      | —                 | MinIO access key                              |
| `MINIO_ROOT_PASSWORD`   | Yes      | —                 | MinIO secret key                              |
| `MINIO_BUCKET_NAME`     | Yes      | —                 | Bucket created automatically on startup       |
| `MINIO_PUBLIC_ENDPOINT` | No       | _(pathname only)_ | Public base URL for client-facing signed URLs |

---

## Upload Strategy Guide

Choose the upload mechanism based on file size and network topology:

| Scenario                      | Mechanism            | Endpoint                             |
| ----------------------------- | -------------------- | ------------------------------------ |
| File ≤ ~50 MB, any type       | **Server-side**      | `POST /assets/upload`                |
| Up to 20 files at once        | **Server-side bulk** | `POST /assets/upload/bulk`           |
| 50 MB – 500 MB, single file   | **Presigned PUT**    | `POST /assets/upload/presigned`      |
| > 500 MB, or resumable needed | **Multipart**        | `POST /assets/upload/multipart/init` |

**Key differences:**

- **Server-side**: the API server buffers the file in memory and streams it to storage. Simple, but adds load on the application server for large files.
- **Presigned PUT**: the server generates a signed URL and the client uploads directly to storage. The API server is not in the data path. Requires a `POST /assets/:id/confirm` call after upload to advance status.
- **Multipart**: the server generates per-part signed URLs. The client uploads chunks in parallel, then calls `POST /assets/upload/multipart/:id/complete` to assemble. Part URLs expire after 6 hours; use the refresh endpoint for long-running uploads.

---

## API Reference

> **Authentication:** All endpoints require `Authorization: Bearer <token>`.
> **Default role:** `Admin`. Exceptions are noted per endpoint.

---

### Server-side Upload

#### `POST /assets/upload`

Upload a single file. The server handles buffering and storage.

**Request:** `multipart/form-data`

| Field  | Type     | Description        |
| ------ | -------- | ------------------ |
| `file` | `binary` | The file to upload |

**Response `200`:**

```json
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "type": "IMAGE",
    "status": "READY",
    "originalName": "avatar.jpg",
    "mimetype": "image/jpeg",
    "size": 204800,
    "key": "assets/images/f47ac10b-58cc-4372-a567-0e02b2c3d479/avatar.jpg",
    "bucket": "svykhoa",
    "visibility": "PRIVATE",
    "metadata": { "width": 1920, "height": 1080, "format": "jpeg" },
    "uploadedBy": "user-uuid",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

---

#### `POST /assets/upload/bulk`

Upload up to 20 files in one request.

**Request:** `multipart/form-data`

| Field   | Type       | Description              |
| ------- | ---------- | ------------------------ |
| `files` | `binary[]` | Files to upload (max 20) |

**Response `200`:** Array of Asset objects in the same order as the submitted files.

---

### Presigned Upload

For files between 50 MB and 500 MB. The client uploads directly to storage; the API server is not in the data path.

#### Step 1 — `POST /assets/upload/presigned`

Request a signed PUT URL.

**Request body:**

```json
{
  "filename": "lecture.mp4",
  "contentType": "video/mp4"
}
```

**Response `200`:**

```json
{
  "data": {
    "assetId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "uploadUrl": "/svykhoa/assets/videos/f47ac10b.../lecture.mp4?X-Amz-Signature=...",
    "key": "assets/videos/f47ac10b-58cc-4372-a567-0e02b2c3d479/lecture.mp4"
  }
}
```

> The `uploadUrl` is valid for **1 hour**.

---

#### Step 2 — Client PUT

```
PUT <uploadUrl>
Content-Type: video/mp4

<binary data>
```

---

#### Step 3 — `POST /assets/:id/confirm`

Notify the server that the upload is complete. Advances status from `UPLOADING` to `PROCESSING`.

**Response `200`:** Asset object with `status: "PROCESSING"`.

**Error cases:**

| Status | Code                  | Cause                             |
| ------ | --------------------- | --------------------------------- |
| 400    | `BadRequestException` | Asset is not in `UPLOADING` state |
| 404    | `NotFoundException`   | Asset not found or soft-deleted   |

---

### Multipart Upload

For files over 500 MB, or when resumability is required. Parts can be uploaded in parallel.

#### Step 1 — `POST /assets/upload/multipart/init`

Initialize the session. Returns per-part signed URLs.

**Request body:**

```json
{
  "filename": "lecture-4k.mp4",
  "fileSize": 2147483648,
  "contentType": "video/mp4"
}
```

| Field         | Type     | Validation | Description              |
| ------------- | -------- | ---------- | ------------------------ |
| `filename`    | `string` | Required   | Original filename        |
| `fileSize`    | `number` | `>= 1`     | Total file size in bytes |
| `contentType` | `string` | Required   | MIME type                |

**Response `200`:**

```json
{
  "data": {
    "assetId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "uploadId": "minio-internal-upload-id",
    "key": "assets/videos/f47ac10b.../lecture-4k.mp4",
    "chunkSize": 10485760,
    "totalParts": 205,
    "parts": [
      {
        "partNumber": 1,
        "url": "/svykhoa/assets/videos/...?partNumber=1&X-Amz-Signature=..."
      },
      { "partNumber": 2, "url": "..." }
    ]
  }
}
```

---

#### Step 2 — Client upload (parallel)

Upload each chunk to its signed URL:

```
PUT <parts[n].url>
Content-Length: <chunk size>

<binary chunk>
```

> Save the `ETag` response header from each PUT — it is required in the complete step.

Part URLs expire after **6 hours**. For long-running uploads, refresh before expiry (Step 3).

---

#### Step 3 — `POST /assets/upload/multipart/:id/refresh-parts` _(if needed)_

Renew expired part URLs without restarting the session.

**Request body:**

```json
{
  "partNumbers": [5, 6, 7]
}
```

**Response `200`:**

```json
{
  "data": {
    "parts": [
      { "partNumber": 5, "url": "..." },
      { "partNumber": 6, "url": "..." },
      { "partNumber": 7, "url": "..." }
    ]
  }
}
```

---

#### Step 4 — `GET /assets/upload/multipart/:id/parts` _(reconcile after disconnect)_

List parts already successfully received by storage. Use this after a network interruption to determine which parts need to be re-uploaded.

**Response `200`:**

```json
{
  "data": [
    { "PartNumber": 1, "ETag": "\"abc123\"" },
    { "PartNumber": 2, "ETag": "\"def456\"" }
  ]
}
```

---

#### Step 5 — `POST /assets/upload/multipart/:id/complete`

Assemble all parts. Advances status from `UPLOADING` to `PROCESSING` and cleans up the Redis session.

**Request body:**

```json
{
  "parts": [
    { "PartNumber": 1, "ETag": "\"abc123\"" },
    { "PartNumber": 2, "ETag": "\"def456\"" }
  ]
}
```

**Response `200`:** Asset object with `status: "PROCESSING"`.

---

#### Abort — `DELETE /assets/upload/multipart/:id/abort`

Cancel an in-progress multipart session. Deletes the Redis session and instructs storage to discard any uploaded parts. Sets asset status to `FAILED`.

**Response `200`:** Empty data.

---

### Asset Access

#### `GET /assets/:id`

Retrieve asset metadata.

**Roles:** `Admin`, `User`

**Response `200`:** Full Asset object.

**Error cases:**

| Status | Cause                      |
| ------ | -------------------------- |
| 404    | Asset not found or deleted |

---

#### `GET /assets/:id/url`

Generate a time-limited signed URL to access the file.

**Roles:** `Admin`, `User`

**Query parameters:**

| Parameter | Type     | Default | Description                 |
| --------- | -------- | ------- | --------------------------- |
| `expires` | `number` | `900`   | URL TTL in seconds (15 min) |

**Response `200`:**

```json
{
  "data": {
    "url": "/svykhoa/assets/images/f47ac10b.../avatar.jpg?X-Amz-Signature=..."
  }
}
```

**Error cases:**

| Status | Cause                                         |
| ------ | --------------------------------------------- |
| 400    | Asset status is not `READY`                   |
| 400    | Asset has no storage key (upload not started) |
| 404    | Asset not found or deleted                    |

---

#### `DELETE /assets/:id`

Soft-delete an asset. Sets `deletedAt` on the database record. **Does not remove the file from storage.**

**Roles:** `Admin`

**Response `200`:** Asset object with `deletedAt` populated.

---

## Inter-Module Integration

`AssetModule` is declared `@Global()` — inject `AssetService` directly without importing the module:

```typescript
@Injectable()
export class CourseService {
  constructor(private readonly assetService: AssetService) {}
}
```

### Public API

| Method                    | Signature                                                                       | Description                                    |
| ------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| `uploadSingle`            | `(file: Multer.File, options?: { uploadedBy?: string }) => Promise<Asset>`      | Server-side single upload                      |
| `uploadBulk`              | `(files: Multer.File[], options?: { uploadedBy?: string }) => Promise<Asset[]>` | Server-side bulk upload                        |
| `requestPresignedUpload`  | `(filename, contentType, uploadedBy) => Promise<{ assetId, uploadUrl, key }>`   | Issue a presigned PUT URL                      |
| `confirmPresignedUpload`  | `(assetId) => Promise<Asset>`                                                   | Mark presigned upload complete                 |
| `initMultipartUpload`     | `(filename, fileSize, contentType, uploadedBy) => Promise<...>`                 | Start a multipart session                      |
| `refreshPartUrls`         | `(assetId, partNumbers) => Promise<{ parts }>`                                  | Renew expired part URLs                        |
| `listParts`               | `(assetId) => Promise<CompletedPart[]>`                                         | List uploaded parts from storage               |
| `completeMultipartUpload` | `(assetId, parts) => Promise<Asset>`                                            | Assemble multipart and finalize                |
| `abortMultipartUpload`    | `(assetId) => Promise<void>`                                                    | Cancel and clean up                            |
| `findById`                | `(assetId) => Promise<Asset>`                                                   | Fetch a non-deleted asset or throw 404         |
| `getAccessUrl`            | `(assetId, expires?) => Promise<string>`                                        | Get a signed download URL                      |
| `softDelete`              | `(assetId) => Promise<Asset>`                                                   | Soft-delete the asset record                   |
| `patchMetadata`           | `(assetId, patch: Partial<AssetMetadata>) => Promise<Asset>`                    | Merge arbitrary metadata fields                |
| `patchVideoMetadata`      | `(assetId, patch: Partial<VideoAssetMetadata>) => Promise<Asset>`               | Merge video metadata and set status to `READY` |

### Common integration patterns

**Attach an existing asset to a business entity:**

```typescript
async attachThumbnail(courseId: string, assetId: string) {
  const asset = await this.assetService.findById(assetId);
  // asset.status check is the caller's responsibility if needed
  await this.courseRepository.update(courseId, { thumbnailAssetId: asset.id });
}
```

**Retrieve a signed URL for delivery:**

```typescript
async getVideoUrl(assetId: string): Promise<string> {
  return this.assetService.getAccessUrl(assetId, 3600); // 1-hour URL
}
```

**Update metadata after post-processing (e.g. HLS transcoding):**

```typescript
// Called by the transcoding worker after HLS output is ready
await this.assetService.patchVideoMetadata(assetId, {
  hlsKey: 'assets/videos/uuid/hls/index.m3u8',
  duration: 7214,
  thumbnailKey: 'assets/videos/uuid/thumbnail.jpg',
  hlsVariants: [
    {
      label: '1080p',
      width: 1920,
      height: 1080,
      bitrate: 5_000_000,
      key: 'assets/videos/uuid/hls/1080p.m3u8',
    },
    {
      label: '720p',
      width: 1280,
      height: 720,
      bitrate: 2_500_000,
      key: 'assets/videos/uuid/hls/720p.m3u8',
    },
  ],
})
// patchVideoMetadata also sets status → READY automatically
```

**Update document metadata:**

```typescript
await this.assetService.patchMetadata(assetId, {
  language: 'vi',
  isScanned: false,
})
```

---

## Storage Key Layout

All objects follow a deterministic path:

```
assets/{type-folder}/{assetId}/{originalName}
```

| `AssetType` | Folder      | Example key                                |
| ----------- | ----------- | ------------------------------------------ |
| `IMAGE`     | `images`    | `assets/images/f47ac10b-.../avatar.jpg`    |
| `VIDEO`     | `videos`    | `assets/videos/f47ac10b-.../lecture.mp4`   |
| `DOCUMENT`  | `documents` | `assets/documents/f47ac10b-.../report.pdf` |

The `assetId` segment guarantees uniqueness — two files with the same name never collide.

---

## Session Management (Redis)

Multipart upload state is persisted in Redis to survive server restarts and horizontal scaling.

**Key format:** `asset:upload_session:{assetId}`

**TTL:** 6 hours (same as part URL validity; refreshed on each `refresh-parts` call)

**Session shape:**

```typescript
interface UploadSessionData {
  uploadId: string // MinIO/S3 multipart upload ID
  totalParts: number
  chunkSize: number // always 10 MB
  uploadedParts: CompletedPart[]
}
```

The session is deleted on `complete` (success) or `abort` (cancellation). Orphaned sessions expire automatically via Redis TTL.

---

## Adding a Storage Provider

The `IStorageAdapter` interface is the extension point. No changes to `AssetService` or `AssetStorageService` are needed.

**Step 1** — Create an adapter:

```typescript
// src/libs/asset/storage/adapters/s3.adapter.ts
import type { IStorageAdapter } from './storage-adapter.interface'

export class S3Adapter implements IStorageAdapter {
  // implement all methods of IStorageAdapter
}
```

**Step 2** — Register in `asset.module.ts`:

```typescript
useFactory: (config: ConfigService) => {
  const provider = config.get<string>('storage.provider');

  if (provider === 'minio') return new MinioAdapter({ ... });
  if (provider === 's3')    return new S3Adapter({ region: ..., ... });
  if (provider === 'r2')    return new S3Adapter({ endpoint: `https://${accountId}.r2.cloudflarestorage.com`, ... });

  throw new Error(`Unsupported storage provider: "${provider}"`);
}
```

**Step 3** — Update `STORAGE_PROVIDER` in `.env`.

---

## Security Model

| Concern                       | Implementation                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**            | All endpoints require a valid JWT (`JwtAuthGuard`)                                                                                                                          |
| **Authorization**             | Default role: `Admin`. `GET /assets/:id` and `GET /assets/:id/url` also accept `User` role                                                                                  |
| **File access**               | Assets are `PRIVATE` by default; direct storage access is blocked. Clients must call `GET /assets/:id/url` to receive a short-lived signed URL (default TTL: 15 minutes)    |
| **Upload URL expiry**         | Presigned PUT URLs expire in 1 hour. Multipart part URLs expire in 6 hours                                                                                                  |
| **Soft delete**               | Deleting an asset marks it as deleted in the database and excludes it from all lookups, but the object remains in storage. Physical removal requires a separate cleanup job |
| **Public endpoint rewriting** | When `MINIO_PUBLIC_ENDPOINT` is set, the internal MinIO hostname is replaced in all signed URLs, preventing clients from discovering the internal network address           |
