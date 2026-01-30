import { WordEntry, TranslationResult } from '../../src/domain/types';

describe('Enhanced WordEntry and TranslationResult Types', () => {
  describe('WordEntry with dictionary definitions', () => {
    it('should accept dictionary definitions field', () => {
      const entry: WordEntry = {
        word: 'yoga',
        meanings: ['yoga'],
        dictionaryDefinitions: [
          { source: 'PWG Dictionary', definition: 'union, joining...' },
        ],
      };

      expect(entry.dictionaryDefinitions).toHaveLength(1);
      expect(entry.dictionaryDefinitions?.[0].source).toBe('PWG Dictionary');
      expect(entry.dictionaryDefinitions?.[0].definition).toContain('union');
    });

    it('should accept contextual notes field', () => {
      const entry: WordEntry = {
        word: 'yoga',
        meanings: ['yoga'],
        contextualNote: 'The subject of the sentence - refers to the practice/discipline of yoga',
      };

      expect(entry.contextualNote).toBe(
        'The subject of the sentence - refers to the practice/discipline of yoga'
      );
    });

    it('should accept both dictionaryDefinitions and contextualNote', () => {
      const entry: WordEntry = {
        word: 'citta',
        meanings: ['mind', 'consciousness'],
        dictionaryDefinitions: [
          {
            source: 'PWG Dictionary',
            definition: 'thought, mind, heart, consciousness',
          },
        ],
        contextualNote: "Combines with the next word (vṛtti) to mean 'fluctuations of the mind'",
      };

      expect(entry.word).toBe('citta');
      expect(entry.meanings).toEqual(['mind', 'consciousness']);
      expect(entry.dictionaryDefinitions).toBeDefined();
      expect(entry.contextualNote).toBeDefined();
    });

    it('should work without optional fields (backward compatibility)', () => {
      const entry: WordEntry = {
        word: 'om',
        meanings: ['sacred syllable'],
      };

      expect(entry.word).toBe('om');
      expect(entry.meanings).toEqual(['sacred syllable']);
      expect(entry.dictionaryDefinitions).toBeUndefined();
      expect(entry.contextualNote).toBeUndefined();
    });
  });

  describe('TranslationResult with warnings', () => {
    it('should accept warnings field', () => {
      const result: TranslationResult = {
        originalText: 'yogaḥ',
        iastText: 'yogaḥ',
        words: [{ word: 'yogaḥ', meanings: ['yoga'] }],
        warnings: ['Dictionary API unavailable - showing LLM-only translations'],
      };

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0]).toContain('Dictionary API unavailable');
    });

    it('should work without warnings field (backward compatibility)', () => {
      const result: TranslationResult = {
        originalText: 'yogaḥ',
        iastText: 'yogaḥ',
        words: [{ word: 'yogaḥ', meanings: ['yoga'] }],
      };

      expect(result.originalText).toBe('yogaḥ');
      expect(result.warnings).toBeUndefined();
    });

    it('should accept empty warnings array', () => {
      const result: TranslationResult = {
        originalText: 'yogaḥ',
        iastText: 'yogaḥ',
        words: [{ word: 'yogaḥ', meanings: ['yoga'] }],
        warnings: [],
      };

      expect(result.warnings).toEqual([]);
    });
  });
});
