import React from 'react'
import { Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import type { Chapter } from '../../types'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../utils/formatDate'

export interface ChapterListProps {
  chapters: Chapter[]
  bookSlug: string
  bookId: string
  isAdmin?: boolean
  isAuthenticated?: boolean
  lastReadChapterNumber?: number
  onReorder?: (reorderedChapters: Chapter[]) => void
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  bookSlug,
  bookId,
  isAdmin = false,
  isAuthenticated = false,
  lastReadChapterNumber,
  onReorder,
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return
    const items = Array.from(chapters)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    onReorder(items)
  }

  if (chapters.length === 0) {
    return (
      <div className="border-3 border-ink bg-sand p-8 text-center shadow-hard-sm">
        <p className="font-grotesk text-sm font-bold text-muted">
          No chapters have been released yet. Check back soon!
        </p>
      </div>
    )
  }

  // Admin view with Drag and Drop
  if (isAdmin && onReorder) {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="admin-chapters">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {chapters.map((chapter, index) => (
                <Draggable
                  key={chapter.id}
                  draggableId={chapter.id}
                  index={index}
                >
                  {(providedDraggable) => (
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      className="flex items-center justify-between p-4 bg-parchment border-3 border-ink shadow-hard-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          {...providedDraggable.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing text-muted hover:text-ink text-xl select-none"
                          title="Drag to reorder"
                        >
                          ⠿
                        </span>
                        <div>
                          <span className="font-bangers text-lg text-ink mr-2">
                            CH {chapter.chapterNumber}:
                          </span>
                          <span className="font-grotesk font-bold text-ink">
                            {chapter.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={chapter.status === 'published' ? 'mint' : 'yellow'}>
                          {chapter.status}
                        </Badge>
                        <Link
                          to={`/admin/chapters/${chapter.id}/edit?bookId=${bookId}`}
                          className="px-3 py-1 bg-sage text-ink border-2 border-ink font-bangers text-xs shadow-hard-sm hover:bg-parchment transition-colors"
                        >
                          EDIT
                        </Link>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    )
  }

  // Reader list view
  return (
    <div className="space-y-3">
      {chapters.map((chapter) => {
        const isFree = chapter.chapterNumber === 1
        const isLocked = !isFree && !isAuthenticated
        const isLastRead = lastReadChapterNumber === chapter.chapterNumber

        const content = (
          <div
            className={`flex items-center justify-between p-4 border-3 border-ink transition-all ${
              isLocked
                ? 'bg-ink/5 opacity-80 cursor-not-allowed'
                : 'bg-parchment shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard cursor-pointer'
            } ${isLastRead ? 'ring-4 ring-sage' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-sage border-2 border-ink flex items-center justify-center font-bangers text-lg text-ink shrink-0">
                {chapter.chapterNumber}
              </span>
              <div>
                <h4 className="font-bangers text-xl tracking-comic text-ink">
                  {chapter.title}
                </h4>
                <p className="font-grotesk text-xs text-muted">
                  {formatDate(chapter.updatedAt || chapter.createdAt)}
                  {chapter.wordCount ? ` • ${chapter.wordCount} words` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isLastRead && (
                <span className="hidden sm:inline-block bg-sage text-ink text-xs font-bangers px-2 py-0.5 border border-ink">
                  CONTINUE READING
                </span>
              )}
              {isLocked ? (
                <div className="flex items-center gap-1.5 text-xs font-grotesk font-bold text-muted bg-sand px-2.5 py-1 border border-ink">
                  <span>Log in to read</span>
                </div>
              ) : (
                <span className="font-bangers text-sm text-ink group-hover:text-hunter">
                  READ →
                </span>
              )}
            </div>
          </div>
        )

        if (isLocked) {
          return (
            <Link key={chapter.id} to="/login">
              {content}
            </Link>
          )
        }

        return (
          <Link
            key={chapter.id}
            to={`/read/${bookSlug}/${chapter.chapterNumber}`}
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}
