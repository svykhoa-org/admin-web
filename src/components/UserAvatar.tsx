import { resolveFileUrl } from '@/services/Asset'
import { Avatar, theme } from 'antd'
import type { GlobalToken } from 'antd'
import { useState } from 'react'

interface UserAvatarProps {
  fullName?: string | null
  avatar?: string | null
  size?: number
}

// antd preset palettes — each user gets a stable pair (light bg + strong text)
// from the theme tokens, so letter avatars stay distinct and on-theme.
const PALETTE = [
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'volcano',
  'orange',
  'geekblue',
] as const

// Vietnamese names put the given name last ("BS. Nguyễn Văn A" → "A").
const getInitial = (fullName?: string | null) => {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  return words.at(-1)?.charAt(0).toUpperCase() ?? '?'
}

const pickColor = (token: GlobalToken, seed: string) => {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const name = PALETTE[Math.abs(hash) % PALETTE.length]
  return {
    backgroundColor: token[`${name}2`],
    color: token[`${name}7`],
  }
}

export const UserAvatar = ({ fullName, avatar, size = 32 }: UserAvatarProps) => {
  const { token } = theme.useToken()
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const src = avatar ? resolveFileUrl(avatar) : null
  const showImage = !!src && src !== failedSrc

  return (
    <Avatar
      size={size}
      src={showImage ? src : undefined}
      onError={() => {
        setFailedSrc(src)
        return false
      }}
      style={{
        flexShrink: 0,
        fontWeight: 600,
        // antd auto-scales text to fill the circle; keep letters modest instead.
        fontSize: Math.round(size * 0.42),
        lineHeight: `${size}px`,
        ...(showImage ? {} : pickColor(token, fullName ?? '')),
      }}
    >
      {getInitial(fullName)}
    </Avatar>
  )
}
