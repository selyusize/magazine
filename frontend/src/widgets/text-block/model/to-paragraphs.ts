/** Текст из CMS → абзацы: пустая строка разделяет абзацы, пустые куски отбрасываются. */
export function toParagraphs(text: string | string[]): string[] {
  const chunks = Array.isArray(text) ? text : text.split(/\n\s*\n/);
  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}
