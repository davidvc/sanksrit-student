import { LlmClient, LlmTranslationResponse } from '../domain/llm-client';
import { WordEntry } from '../domain/types';

/**
 * Stubbed translation data including alternative sutra translations.
 */
interface StubbedTranslation {
  words: WordEntry[];
  alternativeTranslations: string[];
}

/**
 * Stubbed response data for known Sanskrit sutras.
 * Used for testing without external LLM dependencies.
 */
const STUBBED_RESPONSES: Record<string, StubbedTranslation> = {
  'atha yoganusasanam': {
    words: [
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
    alternativeTranslations: [
      'Now, the teaching of yoga',
      'Here begins the instruction on yoga',
      'Now begins the discipline of union',
    ],
  },
  'satyameva jayate': {
    words: [
      {
        word: 'satyam',
        meanings: ['truth'],
      },
      {
        word: 'eva',
        meanings: ['indeed', 'only', 'alone'],
      },
      {
        word: 'jayate',
        meanings: ['conquers', 'prevails', 'triumphs'],
      },
    ],
    alternativeTranslations: [
      'Truth alone triumphs',
      'Truth alone prevails',
      'Only truth conquers',
    ],
  },
  'dharmaksetre kuruksetre': {
    words: [
      {
        word: 'dharmakṣetre',
        meanings: ['field of dharma', 'field of righteousness', 'sacred field'],
      },
      {
        word: 'kurukṣetre',
        meanings: ['field of the Kurus', 'land of Kuru', 'Kurukshetra'],
      },
    ],
    alternativeTranslations: [
      'On the field of dharma, on the field of the Kurus',
      'In the sacred field of Kurukshetra',
      'On the field of righteousness, the land of Kuru',
    ],
  },
};

/**
 * Default response for unknown sutras.
 * Provides a valid structure for any input text.
 */
const DEFAULT_RESPONSE: StubbedTranslation = {
  words: [
    {
      word: 'unknown',
      meanings: ['word not in stubbed data'],
    },
  ],
  alternativeTranslations: [
    'Translation not available',
    'Unknown sutra',
  ],
};

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
    const translation = STUBBED_RESPONSES[normalizedSutra] ?? DEFAULT_RESPONSE;

    return {
      words: translation.words,
      alternativeTranslations: translation.alternativeTranslations,
    };
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
