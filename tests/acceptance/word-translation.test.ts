import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';
import { TRANSLATE_SUTRA_QUERY } from '../helpers/graphql-queries';
import {
  expectValidWord,
  expectValidMeanings,
  expectValidWordBreakdown,
} from '../helpers/assertions';
import { TranslationResult } from '../../src/domain/types';

/**
 * GraphQL response shape for translateSutra query.
 */
interface TranslateSutraResponse {
  translateSutra: TranslationResult;
}

describe('Feature: Sanskrit Sutra Word-by-Word Translation', () => {
  describe('Scenario: Display word meanings for a simple sutra', () => {
    const server = createTestServer();

    /**
     * Setup: Submit a Sanskrit sutra for translation.
     *
     * Given I have a Sanskrit sutra in IAST transliteration
     * When I submit the sutra for translation
     */
    it('should accept a sutra and return a translation result', async () => {
      const sutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();

      const result = response.data!.translateSutra;
      expect(result.originalText).toBe(sutra);
    });

    /**
     * Then I should see each word from the sutra listed separately
     */
    it('should see each word from the sutra listed separately', async () => {
      const sutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra },
      });

      const result = response.data!.translateSutra;
      expectValidWordBreakdown(result.words);

      for (const wordEntry of result.words) {
        expectValidWord(wordEntry);
      }
    });

    /**
     * And each word should have one or more meanings provided
     */
    it('should have one or more meanings provided for each word', async () => {
      const sutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra },
      });

      const result = response.data!.translateSutra;

      for (const wordEntry of result.words) {
        expectValidMeanings(wordEntry);
      }
    });
  });
});
