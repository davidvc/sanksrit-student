import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';
import { TranslationResult } from '../../src/domain/types';

/**
 * GraphQL query for testing IAST output.
 */
const TRANSLATE_WITH_IAST_QUERY = `
  query TranslateSutra($sutra: String!) {
    translateSutra(sutra: $sutra) {
      originalText
      iastText
      words {
        word
        meanings
      }
    }
  }
`;

/**
 * GraphQL response shape for translateSutra query with IAST.
 */
interface TranslateSutraResponse {
  translateSutra: TranslationResult;
}

describe('Feature: Include Full Sutra in IAST in Translation Output', () => {
  const server = createTestServer();

  describe('Scenario: Translation output includes IAST text', () => {
    /**
     * Given I submit a sutra in IAST format
     * When I receive the translation result
     * Then the result should include the full sutra in IAST
     */
    it('should include iastText field in response', async () => {
      const iastSutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_WITH_IAST_QUERY,
        variables: { sutra: iastSutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
      expect(response.data!.translateSutra.iastText).toBeDefined();
      expect(response.data!.translateSutra.iastText).toBe(iastSutra);
    });

    /**
     * Given I submit a sutra in Devanagari format
     * When I receive the translation result
     * Then the result should include the full sutra converted to IAST
     */
    it('should convert Devanagari to IAST in iastText field', async () => {
      const devanagariSutra = 'अथ योगानुशासनम्';
      const expectedIast = 'atha yogānuśāsanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_WITH_IAST_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
      expect(response.data!.translateSutra.iastText).toBeDefined();
      // iastText should contain IAST transliteration
      expect(response.data!.translateSutra.iastText).toBe(expectedIast);
    });

    /**
     * originalText should still preserve the original input
     */
    it('should preserve original input while providing IAST', async () => {
      const devanagariSutra = 'अथ योगानुशासनम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_WITH_IAST_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      const result = response.data!.translateSutra;

      // originalText keeps Devanagari
      expect(result.originalText).toBe(devanagariSutra);
      // iastText has IAST version
      expect(result.iastText).toBeDefined();
      expect(result.iastText).not.toBe(devanagariSutra);
    });
  });
});
