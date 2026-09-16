// ---------------------------------------------------------------------------
// Reading time — estimate from word count (HTML stripped). Russian reading
// speed ≈ 180 words/min for considered content.
// ---------------------------------------------------------------------------

const WORDS_PER_MINUTE = 180;

export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ") // strip tags
    .replace(/&[a-z]+;/gi, " ") // strip entities
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export interface ReadingTime {
  words: number;
  minutes: number;
  label: string; // e.g. "5 мин чтения"
}

export function readingTime(html: string): ReadingTime {
  const words = countWords(html);
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return { words, minutes, label: `${minutes} ${pluralMinutes(minutes)} чтения` };
}

function pluralMinutes(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "минута";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "минуты";
  return "минут";
}
