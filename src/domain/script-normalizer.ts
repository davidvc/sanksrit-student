import { ScriptDetector, ScriptType } from './script-detector';
import { ScriptConverter } from './script-converter';

/**
 * Result of normalizing script input to IAST.
 *
 * A discriminated union type that indicates either successful normalization
 * (with the IAST output and detected script type) or failure (with an error message).
 */
export type NormalizationResult =
  | { success: true; iast: string; originalScript: ScriptType }
  | { success: false; error: string };

/**
 * Port interface for normalizing Sanskrit text to IAST.
 *
 * Orchestrates script detection and conversion to provide a single entry point
 * for ensuring input is in IAST format regardless of original script.
 */
export interface ScriptNormalizer {
  /**
   * Normalizes the given text to IAST.
   *
   * - If text is Devanagari, converts it to IAST
   * - If text is already IAST, passes it through unchanged
   * - If text is mixed script, returns an error
   *
   * @param text - The Sanskrit text to normalize
   * @returns Normalization result with IAST output or error
   */
  normalize(text: string): NormalizationResult;
}

/**
 * Implementation of ScriptNormalizer that orchestrates detection and conversion.
 *
 * Uses dependency injection for ScriptDetector and ScriptConverter to enable
 * testing and flexibility in choosing implementations.
 */
export class ScriptNormalizerImpl implements ScriptNormalizer {
  /**
   * Creates a new ScriptNormalizerImpl.
   *
   * @param detector - ScriptDetector for identifying input script type
   * @param converter - ScriptConverter for Devanagari to IAST conversion
   */
  constructor(
    private readonly detector: ScriptDetector,
    private readonly converter: ScriptConverter
  ) {}

  /**
   * Normalizes the given text to IAST.
   *
   * @param text - The Sanskrit text to normalize
   * @returns Normalization result with IAST output or error
   */
  normalize(text: string): NormalizationResult {
    const scriptType = this.detector.detect(text);

    if (scriptType === 'mixed') {
      return {
        success: false,
        error: 'Mixed script input is not supported. Please provide text in either Devanagari or IAST format, not both.',
      };
    }

    if (scriptType === 'devanagari') {
      return {
        success: true,
        iast: this.converter.toIast(text),
        originalScript: 'devanagari',
      };
    }

    // IAST passes through unchanged
    return {
      success: true,
      iast: text,
      originalScript: 'iast',
    };
  }
}
