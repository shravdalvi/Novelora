import React, { useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { VideoExtension } from '../../utils/tiptapVideo'
import { useReaderSettings } from '../../context/ReaderSettingsContext'

export interface ChapterContentProps {
  content: any // TipTap JSON object or string
  className?: string
}

export const ChapterContent: React.FC<ChapterContentProps> = ({
  content,
  className = '',
}) => {
  const { theme, font, fontSize } = useReaderSettings()

  // Parse content if it was passed as stringified JSON
  const parsedContent = useMemo(() => {
    if (!content) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'No content in this chapter.' }],
          },
        ],
      }
    }
    if (typeof content === 'string') {
      try {
        return JSON.parse(content)
      } catch {
        return content // Let TipTap parse as HTML or text
      }
    }
    return content
  }, [content])

  const editor = useEditor(
    {
      editable: false,
      content: parsedContent,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Image.configure({
          inline: false,
          allowBase64: true,
        }),
        VideoExtension,
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
      ],
      editorProps: {
        attributes: {
          class:
            'reader-content-prose focus:outline-none max-w-none transition-colors duration-200',
        },
      },
    },
    [parsedContent]
  )

  const fontClass = font === 'serif' ? 'font-reading-serif' : 'font-reading-sans'
  const themeClass =
    theme === 'dark' ? 'theme-dark' : theme === 'sepia' ? 'theme-sepia' : 'theme-paper'

  return (
    <article
      className={`chapter-body ${themeClass} ${fontClass} ${className} transition-colors duration-200`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="ProseMirror">
        <EditorContent editor={editor} />
      </div>
    </article>
  )
}
