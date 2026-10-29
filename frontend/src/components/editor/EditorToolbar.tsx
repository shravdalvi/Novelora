import type { Editor } from '@tiptap/react'
import { useState } from 'react'
import ImageUploader from './ImageUploader'

interface EditorToolbarProps {
  editor: Editor | null
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

/** Individual toolbar button with neo-brutalist active state */
function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        'w-9 h-9 flex items-center justify-center border-2 border-ink text-sm font-bold text-ink',
        'hover:bg-sage transition-colors duration-100',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active ? 'bg-sage shadow-[2px_2px_0_#0B1D33]' : 'bg-parchment',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/**
 * EditorToolbar — TipTap formatting controls for the Writing Studio.
 * Undo/Redo | H1 H2 H3 | Bold Italic Underline | Quote | List | Scene Break | Insert Image
 */
export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showImageUploader, setShowImageUploader] = useState(false)

  if (!editor) return null

  const handleImageInsert = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run()
    setShowImageUploader(false)
  }

  return (
    <>
      <div className="border-3 border-ink bg-sand p-2 flex flex-wrap gap-1 items-center">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >↩</ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >↪</ToolbarButton>

        <div className="w-px h-6 bg-ink mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >H1</ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >H2</ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >H3</ToolbarButton>

        <div className="w-px h-6 bg-ink mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        ><strong>B</strong></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        ><em>I</em></ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        ><u>U</u></ToolbarButton>

        <div className="w-px h-6 bg-ink mx-1" />

        {/* Blockquote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >❝</ToolbarButton>

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >• —</ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >1.</ToolbarButton>

        <div className="w-px h-6 bg-ink mx-1" />

        {/* Scene break (horizontal rule) */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Scene Break (✦ ✦ ✦)"
        >✦✦✦</ToolbarButton>

        <div className="w-px h-6 bg-ink mx-1" />

        {/* Insert Image */}
        <button
          type="button"
          onClick={() => setShowImageUploader(true)}
          title="Insert Image"
          className="flex items-center gap-1 px-3 h-9 border-2 border-ink bg-deep-sky text-white
                     font-grotesk text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Image
        </button>
      </div>

      {/* Image upload modal */}
      {showImageUploader && (
        <ImageUploader
          folder="chapter-images"
          onInsert={handleImageInsert}
          onClose={() => setShowImageUploader(false)}
        />
      )}
    </>
  )
}
