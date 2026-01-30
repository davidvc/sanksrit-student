import { HybridTranslationService } from '../../src/adapters/hybrid-translation-service';
import { MockLlmClient } from '../../src/adapters/mock-llm-client';
import { MockDictionaryClient } from '../../src/adapters/mock-dictionary-client';

describe('HybridTranslationService', () => {
  let service: HybridTranslationService;
  let llmClient: MockLlmClient;
  let dictionaryClient: MockDictionaryClient;

  beforeEach(() => {
    llmClient = new MockLlmClient();
    dictionaryClient = new MockDictionaryClient();
    service = new HybridTranslationService(llmClient, dictionaryClient);
  });

  describe('Happy Path - Both Services Available', () => {
    it('should merge LLM and dictionary data for each word', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // Should have words from LLM
      expect(result.words.length).toBe(4);

      // First word should have both LLM and dictionary data
      const yogaWord = result.words[0];
      expect(yogaWord.word).toMatch(/yoga/i);
      expect(yogaWord.meanings).toBeDefined(); // From LLM
      expect(yogaWord.meanings.length).toBeGreaterThan(0);
      expect(yogaWord.dictionaryDefinitions).toBeDefined(); // From dictionary
      expect(yogaWord.dictionaryDefinitions!.length).toBeGreaterThan(0);
      expect(yogaWord.contextualNote).toBeDefined(); // From LLM
    });

    it('should include dictionary source attribution', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      const wordWithDict = result.words.find((w) => w.dictionaryDefinitions && w.dictionaryDefinitions.length > 0);
      expect(wordWithDict).toBeDefined();
      expect(wordWithDict!.dictionaryDefinitions![0].source).toBe('PWG Dictionary');
    });

    it('should preserve LLM alternative translations', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      expect(result.alternativeTranslations).toBeDefined();
      expect(result.alternativeTranslations!.length).toBeGreaterThan(0);
      expect(result.alternativeTranslations![0]).toContain('Yoga');
    });

    it('should set originalText and iastText correctly', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      expect(result.originalText).toEqual(['yogaś citta-vṛtti-nirodhaḥ']);
      expect(result.iastText).toEqual(['yogaś citta-vṛtti-nirodhaḥ']);
    });

    it('should not include warnings when both services work', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      expect(result.warnings).toBeUndefined();
    });

    it('should handle words with no dictionary match gracefully', async () => {
      // Using a word that won't match in dictionary
      const result = await service.translate('om');

      expect(result.words.length).toBeGreaterThan(0);
      // Should still have LLM data
      expect(result.words[0].meanings).toBeDefined();
      // Dictionary definitions might be empty, but shouldn't cause error
      if (result.words[0].dictionaryDefinitions) {
        expect(Array.isArray(result.words[0].dictionaryDefinitions)).toBe(true);
      }
    });
  });

  describe('Data Flow - Sequential Execution', () => {
    it('should use LLM word list for dictionary lookups', async () => {
      const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ');

      // LLM breaks compound into 4 words: yogaḥ, citta, vṛtti, nirodhaḥ
      expect(result.words.length).toBe(4);

      // Each word should be looked up in dictionary individually
      const cittaWord = result.words.find((w) => w.word === 'citta');
      const vrttiWord = result.words.find((w) => w.word === 'vṛtti');

      expect(cittaWord).toBeDefined();
      expect(vrttiWord).toBeDefined();

      // Both should have dictionary entries (not combined)
      if (cittaWord?.dictionaryDefinitions && cittaWord.dictionaryDefinitions.length > 0) {
        expect(cittaWord.dictionaryDefinitions[0].definition).toContain('mind');
      }
      if (vrttiWord?.dictionaryDefinitions && vrttiWord.dictionaryDefinitions.length > 0) {
        expect(vrttiWord.dictionaryDefinitions[0].definition).toContain('turning');
      }
    });
  });
});
