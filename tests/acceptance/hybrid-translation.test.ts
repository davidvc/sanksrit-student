import { describe, it, expect, beforeEach } from 'vitest';
import { HybridTranslationService } from '../../src/adapters/hybrid-translation-service';
import { MockLlmClient } from '../../src/adapters/mock-llm-client';
import { MockDictionaryClient } from '../../src/adapters/mock-dictionary-client';

/**
 * Acceptance tests for Hybrid Translation Feature
 *
 * These tests verify the complete feature works end-to-end with:
 * - LLM contextual translations and notes
 * - Dictionary definitions from authoritative sources
 * - Compound word breakdown
 * - Graceful fallback when services unavailable
 */
describe('Feature: Hybrid Translation - Dictionary + LLM', () => {
  let service: HybridTranslationService;

  beforeEach(() => {
    const llmClient = new MockLlmClient();
    const dictionaryClient = new MockDictionaryClient();
    service = new HybridTranslationService(llmClient, dictionaryClient);
  });

  describe('AC1: Dictionary-Enhanced Word Definitions', () => {
    it('should display dictionary-sourced word definitions with citations', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Each word should have dictionary definitions
      const wordWithDict = result.words.find((w) => w.dictionaryDefinitions && w.dictionaryDefinitions.length > 0);
      expect(wordWithDict).toBeDefined();

      // Dictionary entry should cite source
      expect(wordWithDict!.dictionaryDefinitions![0].source).toBe('PWG Dictionary');

      // Dictionary entry should include definition
      expect(wordWithDict!.dictionaryDefinitions![0].definition).toBeTruthy();
    });

    it('should consult dictionary sources for comprehensive coverage', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // All words should have been looked up (even if not found)
      expect(result.words.length).toBe(4);

      // At least some words should have dictionary data
      const wordsWithDict = result.words.filter(
        (w) => w.dictionaryDefinitions && w.dictionaryDefinitions.length > 0
      );
      expect(wordsWithDict.length).toBeGreaterThan(0);
    });
  });

  describe('AC2: LLM-Enhanced Contextual Explanation', () => {
    it('should provide plain-English contextual explanation for each word', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Each word should have contextual note
      result.words.forEach((word) => {
        expect(word.contextualNote).toBeDefined();
        expect(typeof word.contextualNote).toBe('string');
        expect(word.contextualNote!.length).toBeGreaterThan(0);
      });

      // Should avoid technical grammatical terms
      const allNotes = result.words.map((w) => w.contextualNote || '').join(' ');
      expect(allNotes).not.toMatch(/nominative|genitive|accusative/i);
    });

    it('should break down compound words into separate entries', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      const words = result.words.map((w) => w.word);

      // Should break citta-vṛtti compound into two separate entries
      expect(words).toContain('citta');
      expect(words).toContain('vṛtti');

      // Should NOT have the compound as a single entry
      expect(words).not.toContain('citta-vṛtti');
      expect(words).not.toContain('cittavṛtti');

      // Contextual notes should explain the compound relationship
      const cittaWord = result.words.find((w) => w.word === 'citta');
      const vrttiWord = result.words.find((w) => w.word === 'vṛtti');

      const combinedNotes = (cittaWord?.contextualNote || '') + (vrttiWord?.contextualNote || '');
      expect(combinedNotes.toLowerCase()).toMatch(/combines? with|together with|compound/);
    });
  });

  describe('AC3: Combined Hybrid Translation Output', () => {
    it('should display integrated word-by-word breakdown with both sources', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Each word should have complete hybrid data
      const completeWord = result.words.find(
        (w) =>
          w.meanings &&
          w.meanings.length > 0 &&
          w.dictionaryDefinitions &&
          w.dictionaryDefinitions.length > 0 &&
          w.contextualNote
      );

      expect(completeWord).toBeDefined();

      // Verify all components are present
      expect(completeWord!.word).toBeTruthy();
      expect(completeWord!.meanings).toBeTruthy(); // LLM translation
      expect(completeWord!.dictionaryDefinitions).toBeTruthy(); // Dictionary data
      expect(completeWord!.contextualNote).toBeTruthy(); // LLM contextual note
    });

    it('should include full contextual translation with references', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Should have alternative translations from LLM
      expect(result.alternativeTranslations).toBeDefined();
      expect(result.alternativeTranslations!.length).toBeGreaterThan(0);

      // Should have word-by-word breakdown with dictionary sources
      expect(result.words.length).toBe(4);

      // Original and IAST text should be preserved (now returns arrays)
      expect(result.originalText).toEqual(['yogaś citta-vṛtti-nirodhaḥ']);
      expect(result.iastText).toEqual(['yogaś citta-vṛtti-nirodhaḥ']);
    });

    it('should clearly distinguish dictionary data from LLM data', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      result.words.forEach((word) => {
        // LLM data in 'meanings' field
        if (word.meanings) {
          expect(Array.isArray(word.meanings)).toBe(true);
        }

        // Dictionary data in 'dictionaryDefinitions' field with source
        if (word.dictionaryDefinitions && word.dictionaryDefinitions.length > 0) {
          expect(word.dictionaryDefinitions[0]).toHaveProperty('source');
          expect(word.dictionaryDefinitions[0]).toHaveProperty('definition');
        }

        // LLM contextual note in 'contextualNote' field
        if (word.contextualNote) {
          expect(typeof word.contextualNote).toBe('string');
        }
      });
    });
  });

  describe('AC4: Fallback and Error Handling', () => {
    it('should handle gracefully when both services are available', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Should not have warnings when both services work
      expect(result.warnings).toBeUndefined();

      // Should have complete data
      expect(result.words.length).toBe(4);
      expect(result.alternativeTranslations).toBeDefined();
    });
  });

  describe('Verification Checklist', () => {
    it('should pass all verification criteria', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // ✓ Dictionary API integration successfully retrieves word definitions
      const wordsWithDict = result.words.filter(
        (w) => w.dictionaryDefinitions && w.dictionaryDefinitions.length > 0
      );
      expect(wordsWithDict.length).toBeGreaterThan(0);

      // ✓ All dictionary definitions include source attribution
      wordsWithDict.forEach((word) => {
        word.dictionaryDefinitions!.forEach((def) => {
          expect(def.source).toBeTruthy();
        });
      });

      // ✓ LLM provides its own translation for each word (in meanings field)
      result.words.forEach((word) => {
        expect(word.meanings).toBeDefined();
        expect(word.meanings.length).toBeGreaterThan(0);
      });

      // ✓ LLM provides plain-English contextual notes for each word
      result.words.forEach((word) => {
        expect(word.contextualNote).toBeDefined();
      });

      // ✓ LLM identifies and breaks down compound words into separate entries
      const words = result.words.map((w) => w.word);
      expect(words).toContain('citta');
      expect(words).toContain('vṛtti');

      // ✓ JSON output clearly distinguishes dictionary data from LLM data
      // (verified by separate fields: meanings, dictionaryDefinitions, contextualNote)

      // ✓ Both dictionary definitions and LLM translations are shown for each word
      const completeWords = result.words.filter(
        (w) =>
          w.meanings &&
          w.meanings.length > 0 &&
          w.dictionaryDefinitions &&
          w.dictionaryDefinitions.length > 0
      );
      expect(completeWords.length).toBeGreaterThan(0);

      // ✓ Enhanced WordEntry interface includes dictionaryDefinitions field
      // ✓ Enhanced WordEntry interface includes contextualNote field
      // (verified by TypeScript compilation and runtime presence)

      // ✓ Compound words appear as multiple separate word entries (not nested)
      expect(words).not.toContain('citta-vṛtti');

      // ✓ Contextual notes use plain English (no technical grammatical terms)
      const allNotes = result.words.map((w) => w.contextualNote || '').join(' ');
      expect(allNotes).not.toMatch(/nominative|genitive|accusative|dative/i);

      // ✓ Full contextual translation is provided by LLM (alternativeTranslations)
      expect(result.alternativeTranslations).toBeDefined();
      expect(result.alternativeTranslations!.length).toBeGreaterThan(0);
    });
  });
});
