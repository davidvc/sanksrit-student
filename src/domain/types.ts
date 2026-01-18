/**
 * Represents a single word from a Sanskrit sutra with its grammatical
 * analysis and meanings.
 */
export interface WordEntry {
  /** The Sanskrit word in IAST transliteration */
  word: string;

  /** The grammatical form (e.g., "noun, nominative, singular") */
  grammaticalForm: string;

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

  /** Word-by-word breakdown with grammatical analysis */
  words: WordEntry[];
}
