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
});
