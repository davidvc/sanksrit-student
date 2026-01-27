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
  'yoga sutra': {
    words: [
      {
        word: 'yoga',
        meanings: ['union', 'yoking', 'practice'],
      },
      {
        word: 'sūtra',
        meanings: ['thread', 'aphorism', 'concise statement'],
      },
    ],
    alternativeTranslations: [
      'The Yoga Aphorisms',
      'Threads on Union',
      'Aphorisms on Practice',
    ],
  },
  om: {
    words: [
      {
        word: 'oṃ',
        meanings: ['sacred syllable', 'primordial sound', 'universal sound'],
      },
    ],
    alternativeTranslations: [
      'Om - the sacred syllable',
      'The primordial sound',
      'The universal vibration',
    ],
  },
  'asato ma sadgamaya\ntamaso ma jyotirgamaya': {
    words: [
      {
        word: 'asato',
        meanings: ['from untruth', 'from non-being'],
      },
      {
        word: 'mā',
        meanings: ['me', 'to me'],
      },
      {
        word: 'sadgamaya',
        meanings: ['lead to truth', 'guide to being'],
      },
      {
        word: 'tamaso',
        meanings: ['from darkness'],
      },
      {
        word: 'jyotirgamaya',
        meanings: ['lead to light'],
      },
    ],
    alternativeTranslations: [
      'From untruth lead me to truth, from darkness lead me to light',
      'Lead me from the unreal to the real, from darkness to light',
      'Guide me from falsehood to truth, from ignorance to illumination',
    ],
  },
  'yogascittavrttinirodhah': {
    words: [
      {
        word: 'yogaḥ',
        meanings: ['yoga is', 'union is'],
      },
      {
        word: 'citta',
        meanings: ['mind', 'consciousness'],
      },
      {
        word: 'vṛtti',
        meanings: ['fluctuations', 'modifications', 'patterns'],
      },
      {
        word: 'nirodhaḥ',
        meanings: ['cessation', 'restraint', 'control'],
      },
    ],
    alternativeTranslations: [
      'Yoga is the cessation of the fluctuations of the mind',
      'Yoga is the restraint of mental modifications',
      'Union is the control of consciousness patterns',
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
