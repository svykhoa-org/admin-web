import { uploadArticleImage } from '@/services/Article'
import { App } from 'antd'
import { useCallback, useMemo, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface ArticleEditorProps {
  value?: string
  onChange: (html: string) => void
}

/**
 * Rich-text editor for article content. Same react-quill surface as the forum
 * composer, plus an inline image handler that uploads to the article image
 * endpoint (PUBLIC asset) and embeds the returned URL at the cursor.
 */
export const ArticleEditor = ({ value, onChange }: ArticleEditorProps) => {
  const { message } = App.useApp()
  const quillRef = useRef<ReactQuill>(null)

  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const { url } = await uploadArticleImage(file)
        const editor = quillRef.current?.getEditor()
        if (!editor) return
        const range = editor.getSelection(true)
        const index = range?.index ?? editor.getLength()
        editor.insertEmbed(index, 'image', url)
        editor.setSelection(index + 1, 0)
      } catch {
        void message.error('Tải ảnh lên thất bại')
      }
    }
    input.click()
  }, [message])

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'link', 'image'],
          ['clean'],
        ],
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler],
  )

  return (
    <ReactQuill
      ref={quillRef}
      className="content-editor"
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
    />
  )
}
