import { MockLlmClient } from '../../src/adapters/mock-llm-client';

describe('LLM Client - Contextual Notes and Compound Words', () => {
  let client: MockLlmClient;

  beforeEach(() => {
    client = new MockLlmClient();
  });

  describe('Contextual Notes', () => {
    it('should return contextual notes for each word', async () => {
      const result = await client.translateSutra('yogaś citta-vṛtti-nirodhaḥ');

      // Every word should have a contextualNote
      expect(result.words.length).toBeGreaterThan(0);
      result.words.forEach((word) => {
        expect(word.contextualNote).toBeDefined();
        expect(typeof word.contextualNote).toBe('string');
        expect(word.contextualNote!.length).toBeGreaterThan(0);
      });
    });

    it('should use plain English in contextual notes (no technical terms)', async () => {
      const result = await client.translateSutra('yogaś citta-vṛtti-nirodhaḥ');

      // Check that contextual notes don't contain technical grammatical terms
      const allNotes = result.words
        .map((w) => w.contextualNote || '')
        .join(' ')
        .toLowerCase();

      // Should not contain technical terms like "nominative", "genitive", etc.
      expect(allNotes).not.toMatch(/nominative|genitive|accusative|dative|ablative|locative|instrumental|vocative/i);
    });

    it('should explain the role of the word in the sentence', async () => {
      const result = await client.translateSutra('yogaś citta-vṛtti-nirodhaḥ');

      const yogaWord = result.words.find((w) => w.word === 'yogaḥ' || w.word === 'yogaś');
      expect(yogaWord?.contextualNote).toMatch(/subject|what yoga is|refers to/i);
    });
  });

  describe('Compound Word Breakdown', () => {
    it('should break citta-vṛtti compound into two separate entries', async () => {
      const result = await client.translateSutra('yogaś citta-vṛtti-nirodhaḥ');

      const words = result.words.map((w) => w.word);

      // Should have citta and vṛtti as separate entries
      expect(words).toContain('citta');
      expect(words).toContain('vṛtti');

      // Should NOT have the compound as a single entry
      expect(words).not.toContain('citta-vṛtti');
      expect(words).not.toContain('cittavṛtti');
    });

    it('should explain compound relationship in contextual notes', async () => {
      const result = await client.translateSutra('yogaś citta-vṛtti-nirodhaḥ');

      const cittaWord = result.words.find((w) => w.word === 'citta');
      const vrttiWord = result.words.find((w) => w.word === 'vṛtti');

      // One or both should mention how they combine
      const combinedNotes = (cittaWord?.contextualNote || '') + (vrttiWord?.contextualNote || '');
      expect(combinedNotes.toLowerCase()).toMatch(/combines? with|together with|compound/);
    });

    it('should have all four words as separate entries', async () => {
      const result = await client.translateSutra('yogaś citta-vṛtti-nirodhaḥ');

      // Should have 4 words: yogaḥ, citta, vṛtti, nirodhaḥ
      expect(result.words).toHaveLength(4);

      const words = result.words.map((w) => w.word);
      expect(words.some(w => w.includes('yoga'))).toBe(true);
      expect(words).toContain('citta');
      expect(words).toContain('vṛtti');
      expect(words.some(w => w.includes('nirodha'))).toBe(true);
    });
  });

  describe('Multiple meanings and contextual choice', () => {
    it('should indicate which meaning applies in context', async () => {
      const result = await client.translateSutra('yogaś citta-vṛtti-nirodhaḥ');

      const nirodhaWord = result.words.find((w) => w.word.includes('nirodha'));

      // Should have multiple meanings
      expect(nirodhaWord?.meanings.length).toBeGreaterThan(0);

      // Contextual note should help clarify which meaning is most appropriate
      expect(nirodhaWord?.contextualNote).toBeDefined();
      expect(nirodhaWord?.contextualNote!.length).toBeGreaterThan(10);
    });
  });
});
