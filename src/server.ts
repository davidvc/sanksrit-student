import { createSchema, createYoga } from 'graphql-yoga';
import { LlmTranslationService } from './adapters/llm-translation-service';
import { MockLlmClient } from './adapters/mock-llm-client';
import { TranslationService } from './domain/translation-service';

/**
 * Creates the GraphQL yoga server with the Sanskrit translation schema.
 *
 * @param translationService - Optional translation service. Defaults to MockLlmClient-based service.
 */
export function createServer(translationService?: TranslationService) {
  const service = translationService ?? new LlmTranslationService(new MockLlmClient());

  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        translateSutra(sutra: String!): TranslationResult
      }

      type TranslationResult {
        originalText: String!
        words: [WordEntry!]!
      }

      type WordEntry {
        word: String!
        grammaticalForm: String!
        meanings: [String!]!
      }
    `,
    resolvers: {
      Query: {
        translateSutra: async (
          _parent: unknown,
          args: { sutra: string }
        ) => {
          return service.translate(args.sutra);
        },
      },
    },
  });

  return createYoga({ schema });
}
