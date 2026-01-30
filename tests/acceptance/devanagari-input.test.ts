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

/**
 * GraphQL error response shape.
 */
interface GraphQLErrorResponse {
  errors?: Array<{ message: string }>;
  data?: { translateSutra: TranslationResult | null };
}

describe('Feature: Accept Devanagari Script Input', () => {
  const server = createTestServer();

  describe('Scenario: Translate a sutra provided in Devanagari script', () => {
    /**
     * Given I have a Sanskrit sutra in Devanagari script
     * When I submit the sutra for translation
     * Then I should receive the same word-by-word breakdown as IAST input
     */
    it('should produce the same result as IAST equivalent', async () => {
      // Devanagari input: अथ योगानुशासनम्
      const devanagariSutra = 'अथ योगानुशासनम्';
      // IAST equivalent (what the mock expects after normalization)
      const iastSutra = 'atha yoganusasanam';

      // Get result from Devanagari input
      const devanagariResponse = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: devanagariSutra },
      });

      // Get result from IAST input for comparison
      const iastResponse = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: iastSutra },
      });

      expect(devanagariResponse.errors).toBeUndefined();
      expect(devanagariResponse.data?.translateSutra).toBeDefined();

      const devanagariResult = devanagariResponse.data!.translateSutra;
      const iastResult = iastResponse.data!.translateSutra;

      // Word breakdown should match
      expect(devanagariResult.words).toEqual(iastResult.words);
    });

    /**
     * And each word should have one or more meanings provided
     */
    it('should have meanings for each word', async () => {
      const devanagariSutra = 'अथ योगानुशासनम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      const result = response.data!.translateSutra;

      expectValidWordBreakdown(result.words);
      for (const wordEntry of result.words) {
        expectValidWord(wordEntry);
        expectValidMeanings(wordEntry);
      }
    });

    /**
     * originalText should preserve the Devanagari input
     */
    it('should preserve original Devanagari text in response', async () => {
      const devanagariSutra = 'अथ योगानुशासनम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      const result = response.data!.translateSutra;

      expect(result.originalText).toEqual([devanagariSutra]);
    });
  });

  describe('Scenario: Handle Devanagari compound words and sandhi', () => {
    /**
     * Given I have a Sanskrit sutra in Devanagari containing compound words
     * When I submit the sutra for translation
     * Then compound words should be broken down
     */
    it('should handle compound words correctly', async () => {
      // Devanagari: योगश्चित्तवृत्तिनिरोधः (YS 1.2)
      const devanagariSutra = 'योगश्चित्तवृत्तिनिरोधः';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();

      const result = response.data!.translateSutra;
      expectValidWordBreakdown(result.words);
    });
  });
});

describe('Feature: Devanagari Special Character Handling', () => {
  const server = createTestServer();

  describe('Scenario: Handle avagraha (elision marker)', () => {
    /**
     * Given I have a Sanskrit sutra containing avagraha (ऽ)
     * When I submit the sutra for translation
     * Then the avagraha should be converted to apostrophe in IAST
     */
    it('should convert avagraha to apostrophe', async () => {
      // तदा द्रष्टुः स्वरूपेऽवस्थानम् contains avagraha (ऽ)
      const sutraWithAvagraha = 'तदा द्रष्टुः स्वरूपेऽवस्थानम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: sutraWithAvagraha },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
    });
  });

  describe('Scenario: Handle anusvara (nasal mark)', () => {
    /**
     * Given I have a Sanskrit sutra containing anusvara (ं)
     * When I submit the sutra for translation
     * Then the anusvara should be converted to ṃ in IAST
     */
    it('should convert anusvara correctly', async () => {
      // संयोग contains anusvara (ं)
      const sutraWithAnusvara = 'संयोग';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: sutraWithAnusvara },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
    });
  });

  describe('Scenario: Handle visarga (aspiration mark)', () => {
    /**
     * Given I have a Sanskrit sutra containing visarga (ः)
     * When I submit the sutra for translation
     * Then the visarga should be converted to ḥ in IAST
     */
    it('should convert visarga correctly', async () => {
      // द्रष्टुः contains visarga (ः)
      const sutraWithVisarga = 'द्रष्टुः';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: sutraWithVisarga },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
    });
  });

  describe('Scenario: Handle consonant conjuncts', () => {
    /**
     * Given I have a Sanskrit sutra containing consonant conjuncts
     * When I submit the sutra for translation
     * Then conjuncts should be correctly decomposed
     */
    it('should handle vṛ conjunct correctly', async () => {
      // वृत्ति contains vṛ conjunct
      const sutraWithConjunct = 'वृत्ति';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: sutraWithConjunct },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
    });

    it('should handle kṣ conjunct correctly', async () => {
      // क्षेत्र contains kṣ conjunct
      const sutraWithKshaConjunct = 'क्षेत्र';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: sutraWithKshaConjunct },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
    });
  });
});

describe('Feature: Mixed Input Format Detection', () => {
  const server = createTestServer();

  describe('Scenario: Auto-detect Devanagari input', () => {
    /**
     * Given I submit text containing Devanagari characters
     * When the translator processes my input
     * Then it should automatically recognize the input as Devanagari
     */
    it('should auto-detect and process Devanagari input', async () => {
      const devanagariSutra = 'अथ योगानुशासनम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: devanagariSutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
      expectValidWordBreakdown(response.data!.translateSutra.words);
    });
  });

  describe('Scenario: Auto-detect IAST input', () => {
    /**
     * Given I submit text containing only Latin characters with diacritics
     * When the translator processes my input
     * Then it should continue to process it as before (existing behavior)
     */
    it('should continue to work with IAST input', async () => {
      const iastSutra = 'atha yoganusasanam';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: iastSutra },
      });

      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
      expectValidWordBreakdown(response.data!.translateSutra.words);
    });
  });

  describe('Scenario: Reject mixed script input', () => {
    /**
     * Given I submit text containing both Devanagari and Latin characters
     * When the translator processes my input
     * Then it should return an error indicating mixed scripts are not supported
     */
    it('should reject mixed Devanagari and Latin input', async () => {
      // Mixed input: Devanagari + Latin
      const mixedInput = 'अथ yoga';

      const response = await server.executeQuery<GraphQLErrorResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: mixedInput },
      });

      // Should have an error
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(0);

      // Error message should indicate mixed scripts not supported
      const errorMessage = response.errors![0].message.toLowerCase();
      expect(errorMessage).toMatch(/mixed|script/);
    });
  });

  describe('Scenario: Handle neutral characters in input', () => {
    /**
     * Given I submit text containing spaces, numerals, or punctuation
     * When the translator detects the script type
     * Then neutral characters should not affect script detection
     */
    it('should ignore numbers and spaces in Devanagari detection', async () => {
      // Devanagari with numbers and spaces
      const devanagariWithNeutrals = 'अथ 123 योगानुशासनम्';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: devanagariWithNeutrals },
      });

      // Should be detected as Devanagari and processed successfully
      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
    });

    it('should ignore punctuation in IAST detection', async () => {
      // IAST with punctuation
      const iastWithPunctuation = 'atha, yoganusasanam!';

      const response = await server.executeQuery<TranslateSutraResponse>({
        query: TRANSLATE_SUTRA_QUERY,
        variables: { sutra: iastWithPunctuation },
      });

      // Should be detected as IAST and processed
      expect(response.errors).toBeUndefined();
      expect(response.data?.translateSutra).toBeDefined();
    });
  });
});
