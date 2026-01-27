import { OcrEngine, OcrResult, OcrOptions } from '../domain/ocr-engine';

/**
 * Mock OCR engine for testing.
 *
 * Returns predefined OCR results without calling external APIs.
 * Useful for fast, deterministic acceptance tests.
 *
 * Responses can be configured based on filename patterns or set directly.
 */
export class MockOcrEngine implements OcrEngine {
  private responses: Map<string, OcrResult> = new Map();
  private filenameResponses: Map<string, OcrResult> = new Map();
  private defaultResponse: OcrResult = {
    text: 'सत्यमेव जयते',
    confidence: 0.96,
    language: 'sa',
  };
  private currentFilename?: string;

  constructor() {
    // Initialize filename-based responses for common test scenarios
    this.initializeFilenameResponses();
  }

  /**
   * Initialize filename-based responses for test scenarios.
   */
  private initializeFilenameResponses(): void {
    // AC1: Clear Devanagari text
    this.filenameResponses.set('satyameva-jayate.png', {
      text: 'सत्यमेव जयते',
      confidence: 0.96,
      language: 'sa',
    });

    // AC2: Manuscript-style with ligatures
    this.filenameResponses.set('manuscript-dharmakshetra.png', {
      text: 'धर्मक्षेत्रे कुरुक्षेत्रे',
      confidence: 0.89,
      language: 'sa',
    });

    // AC3: Mixed Devanagari and Latin script (Latin already filtered by OCR)
    this.filenameResponses.set('mixed-script-yoga-sutra.png', {
      text: 'योग सूत्र',
      confidence: 0.91,
      language: 'sa',
    });

    // AC6: Poor quality image with noise (low confidence)
    this.filenameResponses.set('low-quality-noisy-om.png', {
      text: 'ॐ',
      confidence: 0.62,
      language: 'sa',
    });
  }

  /**
   * Set filename context for the next extraction.
   * Used by test helpers to provide context.
   *
   * @param filename - Image filename
   */
  setFilename(filename: string): void {
    this.currentFilename = filename;
  }

  /**
   * Set a specific response for testing.
   *
   * @param response - OCR result to return
   */
  setResponse(response: OcrResult): void {
    this.defaultResponse = response;
  }

  /**
   * Set response based on expected text (for multiple test scenarios).
   *
   * @param expectedText - Text to match
   * @param response - OCR result to return
   */
  setResponseFor(expectedText: string, response: OcrResult): void {
    this.responses.set(expectedText, response);
  }

  /**
   * Set response based on filename pattern.
   *
   * @param filename - Filename to match
   * @param response - OCR result to return
   */
  setResponseForFilename(filename: string, response: OcrResult): void {
    this.filenameResponses.set(filename, response);
  }

  /**
   * Extract text - returns mocked response based on context.
   *
   * Response selection priority:
   * 1. Filename-based response (if currentFilename matches)
   * 2. Default response
   */
  async extractText(imageBuffer: Buffer, options?: OcrOptions): Promise<OcrResult> {
    // Check for filename-based response
    if (this.currentFilename && this.filenameResponses.has(this.currentFilename)) {
      return this.filenameResponses.get(this.currentFilename)!;
    }

    // Fallback to default
    return this.defaultResponse;
  }
}
