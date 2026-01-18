import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeLlmClient } from '../../src/adapters/claude-llm-client';
import Anthropic from '@anthropic-ai/sdk';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn(),
  };
});

describe('ClaudeLlmClient', () => {
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockAnthropicInstance: { messages: { create: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate = vi.fn();
    mockAnthropicInstance = {
      messages: {
        create: mockCreate,
      },
    };
    vi.mocked(Anthropic).mockImplementation(() => mockAnthropicInstance as unknown as Anthropic);
  });

  describe('translateSutra', () => {
    it('should send sutra to Claude and parse response into LlmTranslationResponse', async () => {
      // Arrange
      const sutra = 'atha yoganusasanam';
      const claudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              words: [
                {
                  word: 'atha',
                  grammaticalForm: 'indeclinable, adverb',
                  meanings: ['now', 'here begins'],
                },
                {
                  word: 'yoga',
                  grammaticalForm: 'noun, masculine, nominative, singular',
                  meanings: ['yoga', 'union', 'discipline'],
                },
                {
                  word: 'anusasanam',
                  grammaticalForm: 'noun, neuter, nominative, singular',
                  meanings: ['instruction', 'teaching', 'exposition'],
                },
              ],
            }),
          },
        ],
      };
      mockCreate.mockResolvedValue(claudeResponse);

      const client = new ClaudeLlmClient('test-api-key');

      // Act
      const result = await client.translateSutra(sutra);

      // Assert
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining('claude'),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(sutra),
            }),
          ]),
        })
      );

      expect(result.words).toHaveLength(3);
      expect(result.words[0]).toEqual({
        word: 'atha',
        grammaticalForm: 'indeclinable, adverb',
        meanings: ['now', 'here begins'],
      });
      expect(result.words[1]).toEqual({
        word: 'yoga',
        grammaticalForm: 'noun, masculine, nominative, singular',
        meanings: ['yoga', 'union', 'discipline'],
      });
      expect(result.words[2]).toEqual({
        word: 'anusasanam',
        grammaticalForm: 'noun, neuter, nominative, singular',
        meanings: ['instruction', 'teaching', 'exposition'],
      });
    });

    it('should throw error when API key is missing', () => {
      // Arrange & Act & Assert
      expect(() => new ClaudeLlmClient('')).toThrow('ANTHROPIC_API_KEY is required');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('API rate limit exceeded');
      mockCreate.mockRejectedValue(apiError);

      const client = new ClaudeLlmClient('test-api-key');

      // Act & Assert
      await expect(client.translateSutra('test sutra')).rejects.toThrow(
        'Failed to translate sutra: API rate limit exceeded'
      );
    });

    it('should handle invalid JSON response from Claude', async () => {
      // Arrange
      const claudeResponse = {
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      };
      mockCreate.mockResolvedValue(claudeResponse);

      const client = new ClaudeLlmClient('test-api-key');

      // Act & Assert
      await expect(client.translateSutra('test sutra')).rejects.toThrow(
        'Failed to parse Claude response'
      );
    });

    it('should handle response missing words array', async () => {
      // Arrange
      const claudeResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ notWords: [] }),
          },
        ],
      };
      mockCreate.mockResolvedValue(claudeResponse);

      const client = new ClaudeLlmClient('test-api-key');

      // Act & Assert
      await expect(client.translateSutra('test sutra')).rejects.toThrow(
        'Invalid response structure: missing words array'
      );
    });

    it('should handle empty content response', async () => {
      // Arrange
      const claudeResponse = {
        content: [],
      };
      mockCreate.mockResolvedValue(claudeResponse);

      const client = new ClaudeLlmClient('test-api-key');

      // Act & Assert
      await expect(client.translateSutra('test sutra')).rejects.toThrow(
        'Empty response from Claude'
      );
    });

    it('should extract JSON from markdown code blocks', async () => {
      // Arrange
      const sutra = 'atha';
      const claudeResponse = {
        content: [
          {
            type: 'text',
            text: '```json\n{"words": [{"word": "atha", "grammaticalForm": "indeclinable", "meanings": ["now"]}]}\n```',
          },
        ],
      };
      mockCreate.mockResolvedValue(claudeResponse);

      const client = new ClaudeLlmClient('test-api-key');

      // Act
      const result = await client.translateSutra(sutra);

      // Assert
      expect(result.words).toHaveLength(1);
      expect(result.words[0].word).toBe('atha');
    });

    it('should use environment variable for API key when not provided', () => {
      // Arrange
      const originalEnv = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'env-api-key';

      // Act
      const client = new ClaudeLlmClient();

      // Assert - should not throw
      expect(client).toBeDefined();

      // Cleanup
      process.env.ANTHROPIC_API_KEY = originalEnv;
    });
  });
});
