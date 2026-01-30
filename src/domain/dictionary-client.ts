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
 * Port interface for dictionary lookup operations.
 *
 * This abstracts dictionary lookups, allowing different implementations
 * such as C-SALT API client, mock clients for testing, or other dictionary services.
 */
export interface DictionaryClient {
  /**
   * Looks up a single Sanskrit word in the dictionary.
   *
   * @param word - The Sanskrit word in IAST transliteration
   * @returns Array of dictionary definitions (may be empty if word not found)
   */
  lookupWord(word: string): Promise<DictionaryDefinition[]>;

  /**
   * Looks up multiple Sanskrit words in the dictionary.
   *
   * @param words - Array of Sanskrit words in IAST transliteration
   * @returns Map of words to their dictionary definitions
   */
  lookupWords(words: string[]): Promise<Map<string, DictionaryDefinition[]>>;
}
