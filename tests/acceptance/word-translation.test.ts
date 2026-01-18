import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';
import { TranslationResult } from '../../src/domain/types';

/**
 * Response type for the translateSutra query.
 */
interface TranslateSutraResponse {
  translateSutra: TranslationResult;
}

/**
 * Acceptance test for the first Gherkin scenario:
 *
 * Given I have a Sanskrit sutra in IAST transliteration
 * When I submit the sutra for translation
 * Then I should see each word from the sutra listed separately
 * And each word should have its grammatical form identified
 * And each word should have one or more meanings provided
 */
describe('Display word meanings for a simple sutra', () => {
  it('should return word-by-word breakdown with grammatical forms and meanings', async () => {
    // Given I have a Sanskrit sutra in IAST transliteration
    const sutra = 'atha yogānuśāsanam';

    // When I submit the sutra for translation
    const server = createTestServer();
    const response = await server.executeQuery<TranslateSutraResponse>({
      query: `
        query TranslateSutra($sutra: String!) {
          translateSutra(sutra: $sutra) {
            originalText
            words {
              word
              grammaticalForm
              meanings
            }
          }
        }
      `,
      variables: { sutra },
    });

    // Then I should see each word from the sutra listed separately
    expect(response.errors).toBeUndefined();
    expect(response.data?.translateSutra).toBeDefined();

    const result = response.data!.translateSutra;
    expect(result.originalText).toBe(sutra);
    expect(result.words).toBeInstanceOf(Array);
    expect(result.words.length).toBeGreaterThan(0);

    // And each word should have its grammatical form identified
    // And each word should have one or more meanings provided
    for (const wordEntry of result.words) {
      expect(wordEntry.word).toBeDefined();
      expect(typeof wordEntry.word).toBe('string');
      expect(wordEntry.word.length).toBeGreaterThan(0);

      expect(wordEntry.grammaticalForm).toBeDefined();
      expect(typeof wordEntry.grammaticalForm).toBe('string');
      expect(wordEntry.grammaticalForm.length).toBeGreaterThan(0);

      expect(wordEntry.meanings).toBeInstanceOf(Array);
      expect(wordEntry.meanings.length).toBeGreaterThan(0);
      for (const meaning of wordEntry.meanings) {
        expect(typeof meaning).toBe('string');
        expect(meaning.length).toBeGreaterThan(0);
      }
    }
  });
});
