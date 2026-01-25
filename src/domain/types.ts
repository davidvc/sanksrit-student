/**
 * Represents a single word from a Sanskrit sutra with its grammatical
 * analysis and meanings.
 */
export interface WordEntry {
  /** The Sanskrit word in IAST transliteration */
  word: string;

  /** One or more English meanings for this word */
  meanings: string[];
}

/**
 * Represents the complete translation result for a Sanskrit sutra,
 * including the original text and word-by-word breakdown.
 */
export interface TranslationResult {
  /** The original sutra text that was submitted */
  originalText: string;

  /** The sutra text in IAST transliteration */
  iastText: string;

  /** Word-by-word breakdown with meanings */
  words: WordEntry[];
}

/**
 * Error thrown when translation fails due to invalid input or processing errors.
 */
export class TranslationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationError';
  }
}
