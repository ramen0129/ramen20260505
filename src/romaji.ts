// Minimal romaji normalization utilities

// normalizeRomaji: lowercase, handle sokuon (促音), yōon (拗音) and ん (n) cases
export function normalizeRomaji(s: string): string {
  s = s.toLowerCase();
  // allow apostrophe for disambiguation, strip other non-letters
  s = s.replace(/[^a-z']/g, '');

  // explicit n' -> ん
  s = s.replace(/n'/g, 'ん');
  // double n (nn) -> ん
  s = s.replace(/nn/g, 'ん');
  // n before a non-vowel (or end) -> ん (handles kan, san etc.)
  s = s.replace(/n(?=[^aeiouy]|$)/g, 'ん');

  // sokuon (促音): doubled consonant (except n) => っ + consonant
  // e.g., kko -> っkko (kept consonant so matching logic can detect the pause)
  s = s.replace(/([bcdfghjklmpqrstvwxyz])\1/g, 'っ$1');

  return s;
}
