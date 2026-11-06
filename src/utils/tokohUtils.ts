/**
 * Utility functions for parsing, normalizing, and handling figures (Tokoh) in ISMS.
 * Supports splitting by comma (,) or semicolon (;), trimming whitespace, deduplication,
 * and canonical formatting.
 */

export const CANONICAL_ALIASES: Array<{ match: RegExp; canonical: string }> = [
  { match: /donald\s+trump/i, canonical: 'Donald Trump' },
  { match: /zelensk/i, canonical: 'Volodymyr Zelenskyy' },
  { match: /putin/i, canonical: 'Vladimir Putin' },
  { match: /macron/i, canonical: 'Emmanuel Macron' },
  { match: /maduro/i, canonical: 'Nicolás Maduro' },
  { match: /starmer/i, canonical: 'Keir Starmer' },
  { match: /pemerintah\s+rusia/i, canonical: 'Pemerintah Rusia' },
  { match: /pemerintah\s+(as|amerika)/i, canonical: 'Pemerintah AS' },
  { match: /pemerintah\s+ukraina/i, canonical: 'Pemerintah Ukraina' },
  { match: /pemerintah\s+jerman/i, canonical: 'Pemerintah Jerman' },
  { match: /pemerintah\s+norwegia/i, canonical: 'Pemerintah Norwegia' },
  { match: /uni\s+eropa/i, canonical: 'Uni Eropa' },
  { match: /kementerian\s+pertahanan\s+rusia/i, canonical: 'Kemenhan Rusia' },
  { match: /\bcia\b/i, canonical: 'CIA' },
  { match: /us\s+coast\s+guard/i, canonical: 'US Coast Guard' },
  { match: /john\s+olav\s+fuglem/i, canonical: 'John Olav Fuglem' },
];

/**
 * Normalizes a raw string of figures, splitting on comma, semicolon, or "dan",
 * and maps to canonical aliases when applicable.
 */
export function normalizeTokohNames(raw?: string | null): string[] {
  if (!raw) return [];
  const clean = raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  const parts = clean.split(/[,;]|\bDAN\b/i);
  const result: string[] = [];

  parts.forEach((p) => {
    const t = p.trim().replace(/^[-•*–—\s]+/, '').replace(/[-•*–—\s]+$/, '');
    if (t.length > 2) {
      let matched = false;
      for (const a of CANONICAL_ALIASES) {
        if (a.match.test(t)) {
          result.push(a.canonical);
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Title case formatting
        const titleCase = t.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
        result.push(titleCase);
      }
    }
  });

  return result;
}

/**
 * Parses a raw string containing one or multiple figures separated by comma (,) or semicolon (;).
 * Cleans leading/trailing whitespace, punctuation like bullets/dashes, and deduplicates names while preserving case.
 *
 * @param raw - The input string, e.g. "Donald Trump, Vladimir Putin; Emmanuel Macron"
 * @returns Array of individual figure names, e.g. ["Donald Trump", "Vladimir Putin", "Emmanuel Macron"]
 */
export function parseTokohList(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') return [];

  // Split on comma (,) or semicolon (;)
  const parts = raw.split(/[,;]/);
  const seen = new Set<string>();
  const list: string[] = [];

  for (const part of parts) {
    // Strip leading/trailing bullet points, dashes, spaces, carriage returns
    const clean = part
      .replace(/[\r\n]+/g, ' ')
      .replace(/^[\s\-•*–—]+|[\s\-•*–—]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length > 0) {
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(clean);
      }
    }
  }

  return list;
}

/**
 * Standardizes a multiple-tokoh string by parsing, cleaning, and joining with standard comma-space (', ').
 *
 * @param raw - The input string containing one or multiple figures
 * @returns Standardized string separated by ', ' or empty string if none
 */
export function normalizeMultipleTokoh(raw?: string | null): string {
  const list = parseTokohList(raw);
  return list.join(', ');
}
