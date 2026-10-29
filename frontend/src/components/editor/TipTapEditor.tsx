import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect } from 'react'
import EditorToolbar from './EditorToolbar'

interface TipTapEditorProps {
  content: object | null
  onChange: (json: object) => void
  onWordCountChange?: (count: number) => void
}

/**
 * TipTapEditor — rich text editor for the Writing Studio.
 * Supports headings, bold, italic, underline, blockquote,
 * horizontal rule (scene break), images, and text alignment.
 */
export default function TipTapEditor({ content, onChange, onWordCountChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure horizontal rule to render as scene break
        horizontalRule: {
          HTMLAttributes: {
            class: 'scene-break',
          },
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'chapter-image',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: [
          'prose max-w-none outline-none min-h-[400px] font-literata',
          'text-ink leading-relaxed text-lg',
          'focus:outline-none',
        ].join(' '),
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange(json)

      // Count words for live word count
      if (onWordCountChange) {
        const text = editor.getText()
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length
        onWordCountChange(wordCount)
      }
    },
  })

  // Sync external content changes (e.g. initial load)
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  return (
    <div className="flex flex-col gap-0">
      <EditorToolbar editor={editor} />
      <div className="border-3 border-t-0 border-ink bg-parchment p-6 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
