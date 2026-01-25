import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';
import { TranslationResult } from '../../src/domain/types';

/**
 * GraphQL query that includes iastText field.
 */
const TRANSLATE_SUTRA_WITH_IAST_QUERY = `
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

describe('Feature: Include full sutra in IAST in translation output', () => {
  const server = createTestServer();

  describe('Scenario: IAST text appears in translation output', () => {
    /**
     * Given I submit a sutra in IAST format
     * When the translation completes
     * Then the iastText field should contain the IAST representation
     */
    it('should include iastText field when input is IAST', async () => {
      const iastSutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_WITH_IAST_QUERY,
        variables: { sutra: iastSutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
      expect(response.data!.translateSutra.iastText).toBe(iastSutra);
    });

    /**
     * Given I submit a sutra in Devanagari format
     * When the translation completes
     * Then the iastText field should contain the IAST transliteration
     */
    it('should include IAST transliteration when input is Devanagari', async () => {
      const devanagariSutra = 'अथ योगानुशासनम्';
      const expectedIast = 'atha yogānuśāsanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_WITH_IAST_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
      expect(response.data!.translateSutra.iastText).toBe(expectedIast);
    });
  });

  describe('Scenario: IAST text is clearly distinguishable from original', () => {
    /**
     * Given I submit a sutra in Devanagari
     * When the translation completes
     * Then originalText should contain Devanagari
     * And iastText should contain the IAST transliteration
     */
    it('should keep originalText as Devanagari while iastText is IAST', async () => {
      const devanagariSutra = 'अथ योगानुशासनम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_WITH_IAST_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      const result = response.data!.translateSutra;

      // originalText preserves Devanagari input
      expect(result.originalText).toBe(devanagariSutra);

      // iastText contains IAST (Latin characters with diacritics)
      expect(result.iastText).toBeDefined();
      expect(result.iastText).not.toBe(devanagariSutra);
      // Verify it contains Latin characters (IAST)
      expect(result.iastText).toMatch(/^[a-zA-Zāīūṛṝḷḹēōṃḥñṅṇśṣṭḍ\s]+$/);
    });
  });

  describe('Scenario: Works for all translation requests', () => {
    /**
     * Various input formats should all produce iastText output.
     */
    it('should include iastText for complex compound words', async () => {
      const devanagariCompound = 'योगश्चित्तवृत्तिनिरोधः';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_WITH_IAST_QUERY,
        variables: { sutra: devanagariCompound },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data!.translateSutra.iastText).toBeDefined();
      expect(response.data!.translateSutra.iastText.length).toBeGreaterThan(0);
    });

    it('should include iastText for sutras with special characters', async () => {
      // Contains visarga and avagraha
      const sutraWithSpecialChars = 'तदा द्रष्टुः स्वरूपेऽवस्थानम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_WITH_IAST_QUERY,
        variables: { sutra: sutraWithSpecialChars },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data!.translateSutra.iastText).toBeDefined();
      expect(response.data!.translateSutra.iastText.length).toBeGreaterThan(0);
    });
  });
});
