import { TranslationResult } from './types';

/**
 * Port interface for translation services.
 *
 * This defines the contract for translating Sanskrit sutras. Implementations
 * may use LLMs, mock data, or other translation strategies.
 */
export interface TranslationService {
  /**
   * Translates a Sanskrit sutra and returns a word-by-word breakdown.
   *
   * @param sutra - The Sanskrit sutra in IAST transliteration
   * @returns The translation result with word breakdown
   */
  translate(sutra: string): Promise<TranslationResult>;
}
