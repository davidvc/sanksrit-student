import Anthropic from '@anthropic-ai/sdk';
import { LlmClient, LlmTranslationResponse } from '../domain/llm-client';
import { WordEntry } from '../domain/types';

/**
 * Error thrown when Claude LLM operations fail.
 */
export class ClaudeLlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeLlmError';
  }
}

/**
 * Claude-powered implementation of the LlmClient interface.
 *
 * This adapter uses the Anthropic SDK to send Sanskrit sutras to Claude
 * for word-by-word translation with grammatical analysis.
 */
export class ClaudeLlmClient implements LlmClient {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-20250514';

  /**
   * Creates a new ClaudeLlmClient instance.
   *
   * @param apiKey - The Anthropic API key. If not provided, uses ANTHROPIC_API_KEY environment variable.
   * @throws ClaudeLlmError if no API key is available
   */
  constructor(apiKey?: string) {
    const resolvedApiKey = apiKey ?? process.env.ANTHROPIC_API_KEY;

    if (!resolvedApiKey) {
      throw new ClaudeLlmError('ANTHROPIC_API_KEY is required');
    }

    this.client = new Anthropic({ apiKey: resolvedApiKey });
  }

  /**
   * Sends a Sanskrit sutra to Claude for word-by-word translation.
   *
   * @param sutra - The Sanskrit sutra in IAST transliteration
   * @returns The translation response with word-by-word breakdown
   * @throws ClaudeLlmError on API or parsing errors
   */
  async translateSutra(sutra: string): Promise<LlmTranslationResponse> {
    const prompt = this.buildPrompt(sutra);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return this.parseResponse(response);
    } catch (error) {
      if (error instanceof ClaudeLlmError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ClaudeLlmError(`Failed to translate sutra: ${message}`);
    }
  }

  /**
   * Builds the prompt for Claude to analyze Sanskrit text.
   */
  private buildPrompt(sutra: string): string {
    return `You are a Sanskrit scholar. Analyze the following Sanskrit sutra and provide a word-by-word breakdown.

For each word, provide:
1. The word itself (in IAST transliteration)
2. Its grammatical form (e.g., "noun, masculine, nominative, singular" or "verb, present, active, third person, singular")
3. One or more English meanings

Sanskrit sutra: "${sutra}"

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "words": [
    {
      "word": "the sanskrit word",
      "grammaticalForm": "grammatical description",
      "meanings": ["meaning1", "meaning2"]
    }
  ]
}`;
  }

  /**
   * Parses Claude's response into the LlmTranslationResponse format.
   */
  private parseResponse(response: Anthropic.Message): LlmTranslationResponse {
    if (!response.content || response.content.length === 0) {
      throw new ClaudeLlmError('Empty response from Claude');
    }

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ClaudeLlmError('Empty response from Claude');
    }

    const jsonText = this.extractJson(textContent.text);
    const parsed = this.parseJson(jsonText);

    return this.validateResponse(parsed);
  }

  /**
   * Extracts JSON from the response text, handling markdown code blocks.
   */
  private extractJson(text: string): string {
    // Try to extract from markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    return text.trim();
  }

  /**
   * Parses the JSON string into an object.
   */
  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      throw new ClaudeLlmError('Failed to parse Claude response');
    }
  }

  /**
   * Validates the parsed response has the expected structure.
   */
  private validateResponse(parsed: unknown): LlmTranslationResponse {
    if (!this.isValidResponse(parsed)) {
      throw new ClaudeLlmError('Invalid response structure: missing words array');
    }

    return {
      words: parsed.words.map((w) => this.validateWordEntry(w)),
    };
  }

  /**
   * Type guard to check if the parsed object has the expected shape.
   */
  private isValidResponse(
    obj: unknown
  ): obj is { words: unknown[] } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'words' in obj &&
      Array.isArray((obj as { words: unknown }).words)
    );
  }

  /**
   * Validates and normalizes a word entry from the response.
   */
  private validateWordEntry(entry: unknown): WordEntry {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      !('word' in entry) ||
      !('grammaticalForm' in entry) ||
      !('meanings' in entry)
    ) {
      throw new ClaudeLlmError('Invalid word entry structure');
    }

    const e = entry as Record<string, unknown>;

    return {
      word: String(e.word),
      grammaticalForm: String(e.grammaticalForm),
      meanings: Array.isArray(e.meanings)
        ? e.meanings.map((m) => String(m))
        : [String(e.meanings)],
    };
  }
}
