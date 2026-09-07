/** Formatting does not change whitespace-delimited words; hyphenated words count as one. */
export function countExplanationWords(text: string): number {
  const explanation = text.replace(/\s*\(?\d+\s+words?\)?[.!]?\s*$/i, "").trim();
  return explanation ? explanation.split(/\s+/).length : 0;
}
