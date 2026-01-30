import { DictionaryClient, DictionaryDefinition } from '../domain/dictionary-client';

/**
 * Stubbed dictionary definitions for known Sanskrit words.
 * Used for testing without external dictionary API dependencies.
 */
const STUBBED_DEFINITIONS: Record<string, DictionaryDefinition[]> = {
  yoga: [
    {
      source: 'PWG Dictionary',
      definition:
        'union, joining, contact, method, application, use, means, way, manner, meditation, abstract contemplation',
    },
  ],
  yogah: [
    {
      source: 'PWG Dictionary',
      definition:
        'union, joining, contact, method, application, use, means, way, manner, meditation, abstract contemplation',
    },
  ],
  citta: [
    {
      source: 'PWG Dictionary',
      definition: 'thought, mind, heart, consciousness, attention, intelligence, reason',
    },
  ],
  vrtti: [
    {
      source: 'PWG Dictionary',
      definition:
        'turning, rolling, moving about, activity, function, profession, conduct, behavior, manner of life',
    },
  ],
  nirodha: [
    {
      source: 'PWG Dictionary',
      definition:
        'confinement, locking up, imprisonment, restraint, check, suppression, destruction',
    },
  ],
  nirodhah: [
    {
      source: 'PWG Dictionary',
      definition:
        'confinement, locking up, imprisonment, restraint, check, suppression, destruction',
    },
  ],
};

/**
 * Mock implementation of DictionaryClient for testing purposes.
 *
 * Returns stubbed dictionary definitions for known Sanskrit words.
 * This allows acceptance tests to run without external dictionary API dependencies.
 */
export class MockDictionaryClient implements DictionaryClient {
  /**
   * Looks up a Sanskrit word using stubbed dictionary data.
   *
   * @param word - The Sanskrit word in IAST transliteration
   * @returns Stubbed dictionary definitions for known words, empty array for unknown words
   */
  async lookupWord(word: string): Promise<DictionaryDefinition[]> {
    const normalizedWord = this.normalizeWord(word);
    return STUBBED_DEFINITIONS[normalizedWord] ?? [];
  }

  /**
   * Looks up multiple Sanskrit words using stubbed dictionary data.
   *
   * @param words - Array of Sanskrit words in IAST transliteration
   * @returns Map of words to their stubbed dictionary definitions
   */
  async lookupWords(words: string[]): Promise<Map<string, DictionaryDefinition[]>> {
    const results = new Map<string, DictionaryDefinition[]>();

    for (const word of words) {
      const definitions = await this.lookupWord(word);
      results.set(word, definitions);
    }

    return results;
  }

  /**
   * Normalizes word text for lookup in stubbed definitions.
   * Converts IAST diacritics to ASCII equivalents for matching.
   */
  private normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .trim()
      // Normalize long vowels
      .replace(/[āá]/g, 'a')
      .replace(/[īí]/g, 'i')
      .replace(/[ūú]/g, 'u')
      .replace(/[ṝṛṟ]/g, 'r')
      .replace(/[ḹḷḻ]/g, 'l')
      // Normalize sibilants and nasals
      .replace(/[śṣ]/g, 's')
      .replace(/[ñṅṇ]/g, 'n')
      .replace(/ṃ/g, 'm')
      .replace(/ḥ/g, 'h')
      // Normalize retroflex consonants
      .replace(/ṭ/g, 't')
      .replace(/ḍ/g, 'd');
  }
}
