import { DictionaryClient, DictionaryDefinition } from '../../src/domain/dictionary-client';
import { MockDictionaryClient } from '../../src/adapters/mock-dictionary-client';

describe('DictionaryClient Interface', () => {
  describe('MockDictionaryClient', () => {
    let client: DictionaryClient;

    beforeEach(() => {
      client = new MockDictionaryClient();
    });

    it('should return dictionary definitions with source attribution', async () => {
      const results = await client.lookupWord('yoga');

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('source');
      expect(results[0]).toHaveProperty('definition');
      expect(results[0].source).toBe('PWG Dictionary');
      expect(results[0].definition).toContain('union');
    });

    it('should return empty array for unknown words', async () => {
      const results = await client.lookupWord('unknownword12345');

      expect(results).toEqual([]);
    });

    it('should lookup multiple words at once', async () => {
      const results = await client.lookupWords(['yoga', 'citta']);

      expect(results.size).toBe(2);
      expect(results.get('yoga')).toBeDefined();
      expect(results.get('citta')).toBeDefined();
      expect(results.get('yoga')?.[0].source).toBe('PWG Dictionary');
    });

    it('should handle empty word list', async () => {
      const results = await client.lookupWords([]);

      expect(results.size).toBe(0);
    });

    it('should include definition text in results', async () => {
      const results = await client.lookupWord('citta');

      expect(results).toHaveLength(1);
      expect(results[0].definition).toBeTruthy();
      expect(typeof results[0].definition).toBe('string');
      expect(results[0].definition.length).toBeGreaterThan(0);
    });
  });
});
