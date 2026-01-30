import { ScriptNormalizer } from '../domain/script-normalizer';
import { TranslationService } from '../domain/translation-service';
import { TranslationResult, TranslationError } from '../domain/types';

/**
 * Decorator that adds script normalization to a TranslationService.
 *
 * This wrapper normalizes input text (Devanagari or IAST) to IAST before
 * delegating to the underlying translation service. It preserves the original
 * input text in the response.
 */
export class NormalizingTranslationService implements TranslationService {
  /**
   * Creates a new NormalizingTranslationService.
   *
   * @param normalizer - ScriptNormalizer for converting input to IAST
   * @param delegate - Underlying TranslationService to delegate to
   */
  constructor(
    private readonly normalizer: ScriptNormalizer,
    private readonly delegate: TranslationService
  ) {}

  /**
   * Translates a Sanskrit sutra after normalizing the input script.
   *
   * The input may be in Devanagari or IAST. It is normalized to IAST before
   * translation. The original input text is preserved in the response.
   *
   * @param sutra - The Sanskrit sutra in Devanagari or IAST
   * @returns The translation result with original text and word breakdown
   * @throws TranslationError if input contains mixed scripts
   */
  async translate(sutra: string): Promise<TranslationResult> {
    const normalized = this.normalizer.normalize(sutra);

    if (!normalized.success) {
      throw new TranslationError(normalized.error);
    }

    const result = await this.delegate.translate(normalized.iast);

    // Split multiline input into arrays (always return array, even for single line)
    const originalText = sutra.split('\n').filter(line => line.trim().length > 0);
    const iastText = normalized.iast.split('\n').filter(line => line.trim().length > 0);

    // Preserve original input text and include IAST transliteration
    return {
      ...result,
      originalText,
      iastText,
    };
  }
}
