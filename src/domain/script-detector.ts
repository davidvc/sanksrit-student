/**
 * Represents the detected script type of a text string.
 *
 * - 'devanagari': Text contains only Devanagari characters (plus neutral characters)
 * - 'iast': Text contains only Latin characters including diacritics (plus neutral characters)
 * - 'mixed': Text contains both Devanagari and Latin characters
 */
export type ScriptType = 'devanagari' | 'iast' | 'mixed';

/**
 * Port interface for detecting the script type of Sanskrit text.
 *
 * This defines the contract for identifying whether text is written in
 * Devanagari script, IAST transliteration, or a mixture of both.
 */
export interface ScriptDetector {
  /**
   * Detects the script type of the given text.
   *
   * @param text - The text to analyze for script detection
   * @returns The detected script type
   */
  detect(text: string): ScriptType;
}

/**
 * Unicode range for Devanagari characters: U+0900-U+097F
 */
const DEVANAGARI_RANGE_START = 0x0900;
const DEVANAGARI_RANGE_END = 0x097f;

/**
 * Implementation of ScriptDetector that identifies Devanagari, IAST, or mixed scripts.
 *
 * Detection rules:
 * - Returns 'devanagari' if text contains Devanagari characters (U+0900-U+097F)
 *   and no Latin characters
 * - Returns 'iast' if text contains only Latin characters (including diacritics)
 *   and no Devanagari characters
 * - Returns 'mixed' if text contains both Devanagari and Latin characters
 * - Neutral characters (spaces, numerals, punctuation) are ignored during detection
 */
export class ScriptDetectorImpl implements ScriptDetector {
  /**
   * Detects the script type of the given text.
   *
   * Analyzes each character to determine if the text is written in
   * Devanagari, IAST (Latin with diacritics), or a mixture of both.
   * Neutral characters such as spaces, numerals, and punctuation are
   * ignored during detection.
   *
   * @param text - The text to analyze for script detection
   * @returns The detected script type: 'devanagari', 'iast', or 'mixed'
   */
  detect(text: string): ScriptType {
    let hasDevanagari = false;
    let hasLatin = false;

    for (const char of text) {
      if (this.isDevanagari(char)) {
        hasDevanagari = true;
      } else if (this.isLatin(char)) {
        hasLatin = true;
      }
      // Neutral characters are ignored

      if (hasDevanagari && hasLatin) {
        return 'mixed';
      }
    }

    if (hasDevanagari) {
      return 'devanagari';
    }

    return 'iast';
  }

  /**
   * Checks if a character is in the Devanagari Unicode range.
   *
   * @param char - The character to check
   * @returns True if the character is Devanagari
   */
  private isDevanagari(char: string): boolean {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) {
      return false;
    }
    return codePoint >= DEVANAGARI_RANGE_START && codePoint <= DEVANAGARI_RANGE_END;
  }

  /**
   * Checks if a character is a Latin letter (basic or extended with diacritics).
   *
   * Matches basic Latin letters (A-Z, a-z) as well as Latin letters with
   * diacritics commonly used in IAST transliteration (e.g., a, i, u, n, s, etc.).
   *
   * @param char - The character to check
   * @returns True if the character is a Latin letter
   */
  private isLatin(char: string): boolean {
    // Match Latin letters including those with diacritics
    // Basic Latin: A-Z, a-z
    // Latin Extended-A, Extended-B, Extended Additional for diacritics
    return /\p{Script=Latin}/u.test(char);
  }
}
