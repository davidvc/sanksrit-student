import { HybridTranslationService } from '../../src/adapters/hybrid-translation-service';
import { MockLlmClient } from '../../src/adapters/mock-llm-client';
import { DictionaryClient } from '../../src/domain/dictionary-client';
import { LlmClient } from '../../src/domain/llm-client';

/**
 * Dictionary client that always fails (for testing fallback)
 */
class FailingDictionaryClient implements DictionaryClient {
  async lookupWord(): Promise<never> {
    throw new Error('Dictionary API unavailable');
  }

  async lookupWords(): Promise<never> {
    throw new Error('Dictionary API unavailable');
  }
}

/**
 * LLM client that always fails (for testing fallback)
 */
class FailingLlmClient implements LlmClient {
  async translateSutra(): Promise<never> {
    throw new Error('LLM service unavailable');
  }
}

describe('HybridTranslationService - Fallback Scenarios', () => {
  describe('Dictionary API Unavailable', () => {
    it('should fallback to LLM-only when dictionary fails', async () => {
      const llmClient = new MockLlmClient();
      const dictClient = new FailingDictionaryClient();
      const service = new HybridTranslationService(llmClient, dictClient);

      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Should still have LLM data
      expect(result.words.length).toBe(4);
      expect(result.words[0].meanings).toBeDefined();
      expect(result.words[0].contextualNote).toBeDefined();

      // Dictionary definitions should be empty or undefined (no crash)
      expect(
        result.words[0].dictionaryDefinitions === undefined ||
          result.words[0].dictionaryDefinitions.length === 0
      ).toBe(true);

      // Should include warning
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings![0]).toMatch(/dictionary.*unavailable/i);
    });

    it('should preserve LLM alternative translations on dictionary failure', async () => {
      const llmClient = new MockLlmClient();
      const dictClient = new FailingDictionaryClient();
      const service = new HybridTranslationService(llmClient, dictClient);

      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      expect(result.alternativeTranslations).toBeDefined();
      expect(result.alternativeTranslations!.length).toBeGreaterThan(0);
    });

    it('should maintain all LLM features when dictionary fails', async () => {
      const llmClient = new MockLlmClient();
      const dictClient = new FailingDictionaryClient();
      const service = new HybridTranslationService(llmClient, dictClient);

      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Check all LLM features are present
      result.words.forEach((word) => {
        expect(word.word).toBeDefined();
        expect(word.meanings).toBeDefined();
        expect(word.meanings.length).toBeGreaterThan(0);
        expect(word.contextualNote).toBeDefined();
      });

      expect(result.originalText).toEqual(['yogaś citta-vṛtti-nirodhaḥ']);
      expect(result.iastText).toEqual(['yogaś citta-vṛtti-nirodhaḥ']);
    });
  });

  describe('LLM Service Unavailable', () => {
    it('should throw error when LLM fails (cannot function without LLM)', async () => {
      const llmClient = new FailingLlmClient();
      const dictClient = {
        async lookupWord() {
          return [];
        },
        async lookupWords() {
          return new Map();
        },
      };
      const service = new HybridTranslationService(llmClient, dictClient);

      await expect(service.translate('yogaś citta-vṛtti-nirodhaḥ')).rejects.toThrow(
        /LLM.*unavailable/i
      );
    });
  });

  describe('Warning Message Clarity', () => {
    it('should provide clear warning message about degraded functionality', async () => {
      const llmClient = new MockLlmClient();
      const dictClient = new FailingDictionaryClient();
      const service = new HybridTranslationService(llmClient, dictClient);

      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBe(1);

      const warning = result.warnings![0];
      expect(warning).toContain('Dictionary');
      expect(warning).toMatch(/unavailable|failed/i);
      expect(warning).toContain('LLM-only');
    });
  });
});
