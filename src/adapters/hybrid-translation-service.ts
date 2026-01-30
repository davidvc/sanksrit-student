import { TranslationService } from '../domain/translation-service';
import { TranslationResult } from '../domain/types';
import { LlmClient } from '../domain/llm-client';
import { DictionaryClient } from '../domain/dictionary-client';

/**
 * Hybrid translation service that combines LLM-based translation with
 * authoritative dictionary definitions from C-SALT APIs.
 *
 * This service orchestrates both LLM and dictionary lookups to produce
 * a unified translation result with both contextual analysis and scholarly accuracy.
 */
export class HybridTranslationService implements TranslationService {
  constructor(
    private llmClient: LlmClient,
    private dictionaryClient: DictionaryClient
  ) {}

  /**
   * Translates a Sanskrit sutra using hybrid approach (LLM + Dictionary).
   *
   * Execution Order:
   * 1. Call LLM first to get word breakdown and compound analysis
   * 2. Use LLM's word list to call dictionary API
   * 3. Merge both results into enhanced WordEntry objects
   *
   * Fallback Behavior:
   * - If dictionary API fails: Falls back to LLM-only mode with warning
   * - If LLM fails: Throws error (cannot function without LLM)
   *
   * @param sutra - The Sanskrit sutra in IAST transliteration
   * @returns Enhanced translation result with both LLM and dictionary data
   */
  async translate(sutra: string): Promise<TranslationResult> {
    // Step 1: Get LLM analysis (MUST happen first for compound word breakdown)
    // If LLM fails, we cannot proceed - rethrow the error
    const llmResponse = await this.llmClient.translateSutra(sutra);

    // Step 2: Extract words from LLM response
    const words = llmResponse.words.map((w) => w.word);

    // Step 3: Look up words in dictionary (uses LLM's word list)
    // If dictionary fails, fall back to LLM-only mode
    let dictResults: Map<string, any[]>;
    let warnings: string[] | undefined;

    try {
      dictResults = await this.dictionaryClient.lookupWords(words);
    } catch (error) {
      // Dictionary API unavailable - fall back to LLM-only mode
      dictResults = new Map();
      warnings = ['Dictionary API unavailable - showing LLM-only translations'];
    }

    // Step 4: Merge LLM and dictionary data
    const enhancedWords = llmResponse.words.map((llmWord) => ({
      ...llmWord,
      dictionaryDefinitions: dictResults.get(llmWord.word) || [],
    }));

    // Step 5: Return enhanced result (split multiline into array)
    const originalText = sutra.split('\n').filter(line => line.trim().length > 0);
    const iastText = sutra.split('\n').filter(line => line.trim().length > 0);

    return {
      originalText,
      iastText,
      words: enhancedWords,
      alternativeTranslations: llmResponse.alternativeTranslations,
      warnings,
    };
  }
}
