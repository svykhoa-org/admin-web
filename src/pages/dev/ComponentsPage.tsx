import {
  UploadMultipleDocument,
  UploadMultipleFile,
  UploadMultipleImage,
  UploadMultipleVideo,
  UploadSingleDocument,
  UploadSingleFile,
  UploadSingleImage,
  UploadSingleVideo,
} from '@/components/Upload'
import { getAssetAccessUrl, uploadSingleAsset } from '@/services/Asset'
import { mapAssetToFileResource } from '@/components/Upload/assetResource'
import type { ReactNode } from 'react'

// ─── Upload fn for base components ────────────────────────────────────────────

const demoUploadFn: Parameters<typeof UploadSingleFile>[0]['uploadFn'] = (
  file,
  signal,
  onProgress,
) =>
  uploadSingleAsset(file, 'PUBLIC', signal, onProgress).then(async asset => {
    const url = await getAssetAccessUrl(asset.id).catch(() => undefined)
    return mapAssetToFileResource(asset, url)
  })

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 flex flex-col gap-4">
      <div>
        <span className="text-xs font-mono text-gray-400">#{number}</span>
        <div className="mt-0.5 text-sm font-semibold text-gray-800">{title}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-350 mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Components</h1>
          <p className="text-sm text-gray-500 mt-1">
            Playground — kiểm tra trực tiếp các upload component
          </p>
        </div>

        {/* ── Row 1: Base components ── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Base</h2>
          <div className="grid grid-cols-2 gap-6">
            <Card number={1} title="UploadSingleFile">
              <UploadSingleFile uploadFn={demoUploadFn} />
            </Card>
            <Card number={2} title="UploadMultipleFile">
              <UploadMultipleFile uploadFn={demoUploadFn} />
            </Card>
          </div>
        </section>

        {/* ── Row 2: Single uploads ── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Single</h2>
          <div className="grid grid-cols-3 gap-6">
            <Card number={3} title="UploadSingleImage">
              <UploadSingleImage />
            </Card>
            <Card number={4} title="UploadSingleVideo">
              <UploadSingleVideo onVideoReady={() => {}} />
            </Card>
            <Card number={5} title="UploadSingleDocument">
              <UploadSingleDocument />
            </Card>
          </div>
        </section>

        {/* ── Row 3: Multiple uploads ── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Multiple
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <Card number={6} title="UploadMultipleImage">
              <UploadMultipleImage />
            </Card>
            <Card number={7} title="UploadMultipleVideo">
              <UploadMultipleVideo />
            </Card>
            <Card number={8} title="UploadMultipleDocument">
              <UploadMultipleDocument />
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
