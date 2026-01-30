import { LlmClient } from '../domain/llm-client';
import { TranslationService } from '../domain/translation-service';
import { TranslationResult } from '../domain/types';
import { normalizeToLines } from '../domain/text-normalizer';

/**
 * Implementation of TranslationService that delegates to an LlmClient.
 *
 * This adapter transforms the LLM response (which contains only words) into
 * a complete TranslationResult by adding the original sutra text.
 */
export class LlmTranslationService implements TranslationService {
  private readonly llmClient: LlmClient;

  /**
   * Creates a new LlmTranslationService.
   *
   * @param llmClient - The LLM client to use for translation
   */
  constructor(llmClient: LlmClient) {
    this.llmClient = llmClient;
  }

  /**
   * Translates a Sanskrit sutra by delegating to the LLM client.
   *
   * @param sutra - The Sanskrit sutra in IAST transliteration
   * @returns The translation result with original text and word breakdown
   */
  async translate(sutra: string): Promise<TranslationResult> {
    const llmResponse = await this.llmClient.translateSutra(sutra);

    // Split multiline input into array (always return array, even for single line)
    const originalText = normalizeToLines(sutra);
    const iastText = normalizeToLines(sutra);

    return {
      originalText,
      iastText,
      words: llmResponse.words,
      alternativeTranslations: llmResponse.alternativeTranslations,
    };
  }
}
