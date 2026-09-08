import DOMPurify from 'dompurify'

/**
 * Sanitize article rich-text HTML before rendering with dangerouslySetInnerHTML
 * in the admin preview. The server sanitizes on write (source of truth); this is
 * a defense-in-depth layer for the live preview of unsaved draft content.
 * DOMPurify's defaults strip <script>, on* handlers and javascript: URLs.
 */
export const sanitizeHtml = (html: string | null | undefined): string =>
  DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } })
