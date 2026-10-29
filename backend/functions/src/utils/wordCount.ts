/**
 * Extracts plain text from TipTap JSON and counts words.
 */
export function extractWordCount(tiptapJson: unknown): number {
  if (!tiptapJson || typeof tiptapJson !== 'object') return 0;
  const json = tiptapJson as { content?: unknown[] };

  function extractText(node: unknown): string {
    if (!node || typeof node !== 'object') return '';
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === 'text' && n.text) return n.text;
    if (n.content && Array.isArray(n.content)) {
      return n.content.map(extractText).join(' ');
    }
    return '';
  }

  const text = json.content ? json.content.map(extractText).join(' ') : '';
  return text.trim().split(/\s+/).filter(Boolean).length;
}

