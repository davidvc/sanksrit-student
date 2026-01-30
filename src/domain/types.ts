/**
 * Represents a definition from a Sanskrit dictionary.
 */
export interface DictionaryDefinition {
  /** Name of the dictionary source (e.g., "PWG Dictionary") */
  source: string;

  /** Definition text from the dictionary */
  definition: string;
}

/**
 * Represents a single word from a Sanskrit sutra with its grammatical
 * analysis and meanings.
 */
export interface WordEntry {
  /** The Sanskrit word in IAST transliteration */
  word: string;

  /** One or more English meanings for this word (from LLM) */
  meanings: string[];

  /** Optional dictionary definitions from authoritative sources (NEW) */
  dictionaryDefinitions?: DictionaryDefinition[];

  /** Optional plain-English contextual explanation from LLM (NEW) */
  contextualNote?: string;
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

  /** Alternative translations of the complete sutra (up to 3) */
  alternativeTranslations?: string[];

  /** Optional warnings when services are degraded (NEW) */
  warnings?: string[];
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

/**
 * OCR translation result - extends TranslationResult with OCR metadata.
 */
export interface OcrTranslationResult extends TranslationResult {
  /** OCR confidence score (0.0 to 1.0) */
  ocrConfidence: number;

  /** Raw text extracted by OCR (before normalization) */
  extractedText: string;

  /** Optional warnings (e.g., low confidence) */
  ocrWarnings?: string[];
}
