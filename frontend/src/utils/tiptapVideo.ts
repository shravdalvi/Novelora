import { Node, mergeAttributes } from '@tiptap/core'
import { getYouTubeEmbedUrl } from './youtube'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType
    }
  }
}

export const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chapter-video"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const rawSrc = HTMLAttributes.src || ''
    const embedUrl = getYouTubeEmbedUrl(rawSrc)

    if (embedUrl) {
      return [
        'div',
        {
          'data-type': 'chapter-video',
          class: 'chapter-video-embed my-6 aspect-video w-full rounded border-2 border-ink overflow-hidden bg-black shadow-hard-sm',
        },
        [
          'iframe',
          mergeAttributes({
            src: embedUrl,
            class: 'w-full h-full',
            frameborder: '0',
            allow:
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: 'true',
          }),
        ],
      ]
    }

    return [
      'div',
      {
        'data-type': 'chapter-video',
        class: 'chapter-video-embed my-6 aspect-video w-full rounded border-2 border-ink overflow-hidden bg-black shadow-hard-sm',
      },
      [
        'video',
        mergeAttributes({
          src: rawSrc,
          controls: 'true',
          class: 'w-full h-full',
        }),
      ],
    ]
  },

  addCommands() {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

