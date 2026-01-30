import { createSchema, createYoga } from 'graphql-yoga';
import { TranslationService } from './domain/translation-service';
import { LlmTranslationService } from './adapters/llm-translation-service';
import { NormalizingTranslationService } from './adapters/normalizing-translation-service';
import { MockLlmClient } from './adapters/mock-llm-client';
import { ClaudeLlmClient } from './adapters/claude-llm-client';
import { ScriptDetectorImpl } from './domain/script-detector';
import { ScriptNormalizerImpl } from './domain/script-normalizer';
import { SanscriptConverter } from './adapters/sanscript-converter';
import { OcrTranslationService } from './domain/ocr-translation-service';
import { MockOcrEngine } from './adapters/mock-ocr-engine';
import { InMemoryImageStorage } from './adapters/in-memory-image-storage';

/**
 * Configuration options for creating the GraphQL server.
 */
export interface ServerConfig {
  /** The translation service to use for resolving translation queries */
  translationService: TranslationService;

  /** Optional: OCR translation service for image uploads */
  ocrTranslationService?: OcrTranslationService;
}

/**
 * Creates the script normalizer with detector and converter.
 */
function createScriptNormalizer(): ScriptNormalizerImpl {
  const detector = new ScriptDetectorImpl();
  const converter = new SanscriptConverter();
  return new ScriptNormalizerImpl(detector, converter);
}

/**
 * Creates a ServerConfig using MockLlmClient for testing.
 *
 * @returns Configuration with mock translation service
 */
export function createTestConfig(): ServerConfig {
  const llmClient = new MockLlmClient();
  const baseService = new LlmTranslationService(llmClient);
  const normalizer = createScriptNormalizer();
  const translationService = new NormalizingTranslationService(normalizer, baseService);

  // Create OCR translation service with mocks
  const mockOcrEngine = new MockOcrEngine();
  const imageStorage = new InMemoryImageStorage();
  const ocrTranslationService = new OcrTranslationService(
    mockOcrEngine,
    imageStorage,
    translationService
  );

  return { translationService, ocrTranslationService };
}

/**
 * Creates a ServerConfig using ClaudeLlmClient for production.
 *
 * @returns Configuration with Claude-backed translation service
 */
export function createProductionConfig(): ServerConfig {
  const llmClient = new ClaudeLlmClient();
  const baseService = new LlmTranslationService(llmClient);
  const normalizer = createScriptNormalizer();
  const translationService = new NormalizingTranslationService(normalizer, baseService);
  return { translationService };
}

/**
 * Creates the GraphQL yoga server with the Sanskrit translation schema.
 *
 * @param config - Server configuration with injected dependencies
 * @returns The configured GraphQL yoga server instance
 */
export function createServer(config: ServerConfig) {
  const { translationService, ocrTranslationService } = config;

  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      scalar Upload

      type Query {
        translateSutra(sutra: String!): TranslationResult
      }

      type Mutation {
        translateSutraFromImage(image: Upload!): OcrTranslationResult!
      }

      type TranslationResult {
        originalText: [String!]!
        iastText: [String!]!
        words: [WordEntry!]!
        alternativeTranslations: [String!]
      }

      type OcrTranslationResult {
        originalText: [String!]!
        iastText: [String!]!
        words: [WordEntry!]!
        alternativeTranslations: [String!]
        ocrConfidence: Float!
        extractedText: String!
        ocrWarnings: [String!]
      }

      type WordEntry {
        word: String!
        meanings: [String!]!
      }
    `,
    resolvers: {
      Query: {
        translateSutra: async (_parent: unknown, args: { sutra: string }) => {
          return translationService.translate(args.sutra);
        },
      },
      Mutation: {
        translateSutraFromImage: async (_parent: unknown, args: { image: any }) => {
          if (!ocrTranslationService) {
            throw new Error('OCR translation service not configured');
          }
          return ocrTranslationService.translateFromImage(args.image);
        },
      },
    },
  });

  return createYoga({
    schema,
    maskedErrors: false, // Expose error messages to clients
  });
}
