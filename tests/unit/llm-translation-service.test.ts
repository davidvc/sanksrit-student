import { describe, it, expect, vi } from 'vitest';
import { LlmTranslationService } from '../../src/adapters/llm-translation-service';
import { LlmClient, LlmTranslationResponse } from '../../src/domain/llm-client';
import { WordEntry } from '../../src/domain/types';

/**
 * Unit tests for LlmTranslationService.
 *
 * The service implements TranslationService interface by delegating to an
 * LlmClient and transforming the response to include the original text.
 */
describe('LlmTranslationService', () => {
  /**
   * Creates a mock LlmClient that returns the specified response.
   */
  function createMockLlmClient(response: LlmTranslationResponse): LlmClient {
    return {
      translateSutra: vi.fn().mockResolvedValue(response),
    };
  }

  it('should return translation result with original text and words from LlmClient', async () => {
    // Arrange
    const sutra = 'atha yogānuśāsanam';
    const words: WordEntry[] = [
      {
        word: 'atha',
        grammaticalForm: 'indeclinable',
        meanings: ['now', 'here begins'],
      },
      {
        word: 'yoga',
        grammaticalForm: 'noun, masculine, nominative, singular',
        meanings: ['yoga', 'union', 'discipline'],
      },
      {
        word: 'anuśāsanam',
        grammaticalForm: 'noun, neuter, nominative, singular',
        meanings: ['instruction', 'teaching', 'exposition'],
      },
    ];
    const llmResponse: LlmTranslationResponse = { words };
    const mockClient = createMockLlmClient(llmResponse);

    const service = new LlmTranslationService(mockClient);

    // Act
    const result = await service.translate(sutra);

    // Assert
    expect(result.originalText).toBe(sutra);
    expect(result.words).toEqual(words);
    expect(mockClient.translateSutra).toHaveBeenCalledWith(sutra);
    expect(mockClient.translateSutra).toHaveBeenCalledTimes(1);
  });

  it('should pass the sutra to the LlmClient unchanged', async () => {
    // Arrange
    const sutra = 'yogaś citta-vṛtti-nirodhaḥ';
    const mockClient = createMockLlmClient({ words: [] });
    const service = new LlmTranslationService(mockClient);

    // Act
    await service.translate(sutra);

    // Assert
    expect(mockClient.translateSutra).toHaveBeenCalledWith(sutra);
  });

  it('should propagate errors from the LlmClient', async () => {
    // Arrange
    const sutra = 'atha yogānuśāsanam';
    const error = new Error('LLM service unavailable');
    const mockClient: LlmClient = {
      translateSutra: vi.fn().mockRejectedValue(error),
    };
    const service = new LlmTranslationService(mockClient);

    // Act & Assert
    await expect(service.translate(sutra)).rejects.toThrow('LLM service unavailable');
  });
});
