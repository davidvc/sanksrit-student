/**
 * Common GraphQL queries for acceptance testing.
 * Extracted to promote reuse across test files.
 */

/**
 * GraphQL query for translating a Sanskrit sutra.
 * Returns word-by-word breakdown with meanings.
 */
export const TRANSLATE_SUTRA_QUERY = `
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
