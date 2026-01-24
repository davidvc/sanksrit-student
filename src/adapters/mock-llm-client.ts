import { LlmClient, LlmTranslationResponse } from '../domain/llm-client';
import { WordEntry } from '../domain/types';

/**
 * Stubbed response data for known Sanskrit sutras.
 * Used for testing without external LLM dependencies.
 */
const STUBBED_RESPONSES: Record<string, WordEntry[]> = {
  'atha yoganusasanam': [
    {
      word: 'atha',
      meanings: ['now', 'here begins', 'auspicious beginning'],
    },
    {
      word: 'yogānuśāsanam',
      meanings: [
        'instruction on yoga',
        'teaching of yoga',
        'discipline of yoga',
      ],
    },
  ],
};

/**
 * Default response for unknown sutras.
 * Provides a valid structure for any input text.
 */
const DEFAULT_RESPONSE: WordEntry[] = [
  {
    word: 'unknown',
    meanings: ['word not in stubbed data'],
  },
];

/**
 * Mock implementation of LlmClient for testing purposes.
 *
 * Returns stubbed responses for known test sutras and a generic
 * valid response for unknown input. This allows acceptance tests
 * to run without external LLM dependencies.
 */
export class MockLlmClient implements LlmClient {
  /**
   * Translates a Sanskrit sutra using stubbed data.
   *
   * @param sutra - The Sanskrit sutra in IAST transliteration
   * @returns Stubbed translation response for known sutras,
   *          or a generic valid response for unknown input
   */
  async translateSutra(sutra: string): Promise<LlmTranslationResponse> {
    const normalizedSutra = this.normalizeSutra(sutra);
    const words = STUBBED_RESPONSES[normalizedSutra] ?? DEFAULT_RESPONSE;

    return { words };
  }

  /**
   * Normalizes sutra text for lookup in stubbed responses.
   * Converts IAST diacritics to ASCII equivalents for matching.
   */
  private normalizeSutra(sutra: string): string {
    return sutra
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
