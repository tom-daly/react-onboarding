import { LIST_WORDS } from '../strings/common';

/** "a", "a and b", "a, b and c" (or "a, b or c"). */
export function inWords(items: string[], joiner: 'and' | 'or' = 'and'): string {
  if (items.length < 2) return items.join('');
  return LIST_WORDS[joiner](items.slice(0, -1).join(LIST_WORDS.between), items[items.length - 1]);
}
