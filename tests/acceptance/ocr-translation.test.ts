import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';

/**
 * OCR Translation result from GraphQL mutation.
 */
interface OcrTranslationResult {
  originalText: string;
  iastText: string;
  words: Array<{
    word: string;
    meanings: string[];
  }>;
  alternativeTranslations?: string[];
  ocrConfidence: number;
  extractedText: string;
  ocrWarnings?: string[];
}

/**
 * GraphQL response shape for translateSutraFromImage mutation.
 */
interface TranslateSutraFromImageResponse {
  translateSutraFromImage: OcrTranslationResult;
}

/**
 * Feature: Devanagari OCR Image to Translation
 *
 * Tests cover image upload → OCR extraction → translation flow.
 * Uses MockOcrEngine for fast, deterministic tests without real API calls.
 */
describe('Feature: Devanagari OCR Image to Translation', () => {
  const server = createTestServer();

  /**
   * AC1: Successfully extract and translate clear Devanagari text from image
   *
   * Given: Image containing clear Devanagari text "सत्यमेव जयते"
   * When: User uploads image to OCR translation endpoint
   * Then:
   *   - System extracts Devanagari text correctly
   *   - System provides IAST transliteration "satyameva jayate"
   *   - System provides word-by-word breakdown
   *   - System provides full translation "Truth alone triumphs"
   *   - OCR confidence is high (≥ 90%)
   */
  describe('AC1: Clear Devanagari image to translation', () => {
    it('should extract and translate clear Devanagari text from image', async () => {
      // Arrange
      const mutation = `
        mutation TranslateSutraFromImage($image: Upload!) {
          translateSutraFromImage(image: $image) {
            extractedText
            iastText
            words {
              word
              meanings
            }
            alternativeTranslations
            ocrConfidence
            ocrWarnings
          }
        }
      `;

      // Create a mock file upload (using _buffer for testing)
      const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

      const imageFile = {
        filename: 'satyameva-jayate.png',
        mimetype: 'image/png',
        encoding: '7bit',
        _buffer: imageBuffer, // For testing
      };

      // Act
      const response = await server.executeQuery<TranslateSutraFromImageResponse>({
        query: mutation,
        variables: { image: imageFile },
      });

      // Assert
      expect(response.errors).toBeUndefined();
      expect(response.data).toBeDefined();

      const result = response.data!.translateSutraFromImage;

      // OCR extraction verification
      expect(result.extractedText).toBe('सत्यमेव जयते');
      expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.9);
      // No warnings for high confidence (GraphQL returns null for missing optional fields)
      expect(result.ocrWarnings || undefined).toBeUndefined();

      // Translation verification
      expect(result.iastText).toBe('satyameva jayate');

      // Word-by-word breakdown verification
      expect(result.words).toHaveLength(3);

      expect(result.words[0].word).toBe('satyam');
      expect(result.words[0].meanings).toContain('truth');

      expect(result.words[1].word).toBe('eva');
      expect(result.words[1].meanings).toContain('indeed');

      expect(result.words[2].word).toBe('jayate');
      expect(result.words[2].meanings).toContain('conquers');

      // Alternative translations (optional)
      expect(result.alternativeTranslations).toBeDefined();
      expect(result.alternativeTranslations![0]).toContain('Truth alone');
    });
  });

  /**
   * AC2: Extract and translate from image with Devanagari manuscript style
   *
   * Given: Image containing manuscript-style Devanagari text with ligatures/conjuncts
   * When: User uploads image to OCR translation endpoint
   * Then:
   *   - System extracts Devanagari text correctly
   *   - System handles ligatures (e.g., क्त, त्र, ज्ञ) correctly
   *   - System handles conjunct characters correctly
   *   - System provides accurate IAST transliteration
   *   - System provides word-by-word translation
   */
  describe('AC2: Manuscript-style Devanagari text', () => {
    it('should extract and translate manuscript-style Devanagari with ligatures', async () => {
      // Arrange
      const mutation = `
        mutation TranslateSutraFromImage($image: Upload!) {
          translateSutraFromImage(image: $image) {
            extractedText
            iastText
            words {
              word
              meanings
            }
            alternativeTranslations
            ocrConfidence
            ocrWarnings
          }
        }
      `;

      // Create mock file with manuscript-style text containing ligatures
      // Sanskrit phrase: "धर्मक्षेत्रे कुरुक्षेत्रे" (dharma-kṣetre kuru-kṣetre)
      // Contains ligatures: क्ष (kṣ), त्र (tr)
      const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

      const imageFile = {
        filename: 'manuscript-dharmakshetra.png',
        mimetype: 'image/png',
        encoding: '7bit',
        _buffer: imageBuffer,
      };

      // Act
      const response = await server.executeQuery<TranslateSutraFromImageResponse>({
        query: mutation,
        variables: { image: imageFile },
      });

      // Assert
      expect(response.errors).toBeUndefined();
      expect(response.data).toBeDefined();

      const result = response.data!.translateSutraFromImage;

      // OCR extraction verification - should correctly extract ligatures
      expect(result.extractedText).toBe('धर्मक्षेत्रे कुरुक्षेत्रे');
      expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.85); // Slightly lower for manuscript

      // IAST transliteration - should correctly render ligatures
      expect(result.iastText).toBe('dharmakṣetre kurukṣetre');

      // Word-by-word breakdown verification
      expect(result.words).toHaveLength(2);

      // First word: धर्मक्षेत्रे (dharmakṣetre) - contains क्ष ligature
      expect(result.words[0].word).toBe('dharmakṣetre');
      expect(result.words[0].meanings).toContain('field of dharma');

      // Second word: कुरुक्षेत्रे (kurukṣetre) - contains क्ष ligature
      expect(result.words[1].word).toBe('kurukṣetre');
      expect(result.words[1].meanings).toContain('field of the Kurus');
    });
  });

  /**
   * AC3: Handle image with both Devanagari and Latin script
   *
   * Given: Image containing mixed Devanagari and Latin text
   * When: User uploads image to OCR translation endpoint
   * Then:
   *   - System extracts only the Devanagari portions
   *   - System ignores or separates Latin text
   *   - System translates the Devanagari text accurately
   */
  describe('AC3: Mixed Devanagari and Latin script', () => {
    it('should extract only Devanagari text from mixed script image', async () => {
      // Arrange
      const mutation = `
        mutation TranslateSutraFromImage($image: Upload!) {
          translateSutraFromImage(image: $image) {
            extractedText
            iastText
            words {
              word
              meanings
            }
            alternativeTranslations
            ocrConfidence
            ocrWarnings
          }
        }
      `;

      // Create mock file with mixed Devanagari and Latin text
      // OCR result contains: "योग Yoga सूत्र Sutra"
      // Expected extraction: Only "योग सूत्र" (filtering out Latin)
      const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

      const imageFile = {
        filename: 'mixed-script-yoga-sutra.png',
        mimetype: 'image/png',
        encoding: '7bit',
        _buffer: imageBuffer,
      };

      // Act
      const response = await server.executeQuery<TranslateSutraFromImageResponse>({
        query: mutation,
        variables: { image: imageFile },
      });

      // Assert
      expect(response.errors).toBeUndefined();
      expect(response.data).toBeDefined();

      const result = response.data!.translateSutraFromImage;

      // OCR extraction - should filter out Latin text
      expect(result.extractedText).toBe('योग सूत्र');
      expect(result.extractedText).not.toContain('Yoga');
      expect(result.extractedText).not.toContain('Sutra');
      expect(result.ocrConfidence).toBeGreaterThanOrEqual(0.85);

      // IAST transliteration - only for Devanagari portion
      expect(result.iastText).toBe('yoga sūtra');

      // Word-by-word breakdown - only Devanagari words
      expect(result.words).toHaveLength(2);

      expect(result.words[0].word).toBe('yoga');
      expect(result.words[0].meanings).toContain('union');

      expect(result.words[1].word).toBe('sūtra');
      expect(result.words[1].meanings).toContain('thread');
    });
  });
});
