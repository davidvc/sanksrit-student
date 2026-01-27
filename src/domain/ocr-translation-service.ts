import { OcrEngine } from './ocr-engine';
import { ImageStorageStrategy, FileUpload } from './image-storage-strategy';
import { TranslationService } from './translation-service';
import { OcrTranslationResult } from './types';
import { MockOcrEngine } from '../adapters/mock-ocr-engine';

/**
 * Service that orchestrates OCR → Translation flow.
 *
 * Handles: image upload → OCR extraction → script normalization → translation
 */
export class OcrTranslationService {
  constructor(
    private ocrEngine: OcrEngine,
    private imageStorage: ImageStorageStrategy,
    private translationService: TranslationService
  ) {}

  /**
   * Translate text from an uploaded image.
   *
   * @param upload - Image file upload
   * @param outputFormat - Desired output format (devanagari or iast)
   * @returns Translation result with OCR metadata
   */
  async translateFromImage(
    upload: FileUpload,
    outputFormat: 'devanagari' | 'iast' = 'iast'
  ): Promise<OcrTranslationResult> {
    let handle;

    try {
      // Step 1: Validate image format
      const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff'];
      if (!supportedFormats.includes(upload.mimetype.toLowerCase())) {
        throw new Error(
          `Unsupported image format: ${upload.mimetype}. Supported formats: PNG, JPG, JPEG, WEBP, TIFF`
        );
      }

      // Step 2: Store uploaded image
      handle = await this.imageStorage.store(upload);

      // Step 2.1: Validate image size (max 10MB)
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (handle.size > maxSizeBytes) {
        throw new Error(`Image file too large: ${handle.size} bytes. Maximum allowed: 10MB`);
      }

      // Step 3: Retrieve image buffer
      const buffer = await this.imageStorage.retrieve(handle);

      // Step 4: Set filename context for MockOcrEngine (testing only)
      if (this.ocrEngine instanceof MockOcrEngine) {
        this.ocrEngine.setFilename(upload.filename);
      }

      // Step 5: OCR extraction
      const ocrResult = await this.ocrEngine.extractText(buffer, {
        languageHints: ['hi', 'sa'], // Hindi/Sanskrit for Devanagari
      });

      // Step 6: Validate OCR result
      if (ocrResult.confidence < 0.1) {
        throw new Error('No readable text detected in image');
      }

      // Step 7: Translate extracted text via existing pipeline
      const translation = await this.translationService.translate(ocrResult.text);

      // Step 8: Augment result with OCR metadata
      const warnings: string[] = [];
      if (ocrResult.confidence < 0.7) {
        warnings.push('Low OCR confidence - please verify extracted text');
      }

      const result: OcrTranslationResult = {
        ...translation,
        ocrConfidence: ocrResult.confidence,
        extractedText: ocrResult.text,
      };

      // Only include warnings if there are any
      if (warnings.length > 0) {
        result.ocrWarnings = warnings;
      }

      return result;
    } finally {
      // Step 9: Always cleanup stored image
      if (handle) {
        await this.imageStorage.cleanup(handle).catch(console.error);
      }
    }
  }
}
