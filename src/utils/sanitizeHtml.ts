import DOMPurify from 'dompurify'

/**
 * Sanitize article rich-text HTML before rendering with dangerouslySetInnerHTML
 * in the admin preview. The server sanitizes on write (source of truth); this is
 * a defense-in-depth layer for the live preview of unsaved draft content.
 * DOMPurify's defaults strip <script>, on* handlers and javascript: URLs.
 */
// why: Quill 2's getSemanticHTML() (react-quill-new's onChange value) writes
// every space as &nbsp;, leaving text with no line-break opportunities: it
// overflows its column and list items drop their text below the bullet. The
// server now normalizes on write; this covers content saved before that and
// unsaved editor previews. DOMPurify serializes U+00A0 back as "&nbsp;".
const NBSP = /&nbsp;|\u00a0/g

export const sanitizeHtml = (html: string | null | undefined): string =>
  DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } }).replace(NBSP, ' ')
