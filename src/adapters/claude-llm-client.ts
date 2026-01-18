import Anthropic from '@anthropic-ai/sdk';
import * as path from 'path';
import { LlmClient, LlmTranslationResponse } from '../domain/llm-client';
import { WordEntry } from '../domain/types';
import { PromptLoader } from './prompt-loader';

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
 * Configuration options for ClaudeLlmClient.
 */
export interface ClaudeLlmClientOptions {
  /** The Anthropic API key. If not provided, uses ANTHROPIC_API_KEY environment variable. */
  apiKey?: string;
  /** Custom PromptLoader instance. If not provided, uses default prompts directory. */
  promptLoader?: PromptLoader;
}

/**
 * Claude-powered implementation of the LlmClient interface.
 *
 * This adapter uses the Anthropic SDK to send Sanskrit sutras to Claude
 * for word-by-word translation with grammatical analysis. Prompts are loaded
 * from external configuration files via PromptLoader.
 */
export class ClaudeLlmClient implements LlmClient {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-20250514';
  private readonly promptLoader: PromptLoader;

  /**
   * Creates a new ClaudeLlmClient instance.
   *
   * @param options - Configuration options including API key and prompt loader
   * @throws ClaudeLlmError if no API key is available
   */
  constructor(options: ClaudeLlmClientOptions = {}) {
    const resolvedApiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

    if (!resolvedApiKey) {
      throw new ClaudeLlmError('ANTHROPIC_API_KEY is required');
    }

    this.client = new Anthropic({ apiKey: resolvedApiKey });
    this.promptLoader = options.promptLoader ?? this.createDefaultPromptLoader();
  }

  /**
   * Creates the default PromptLoader using the standard prompts directory.
   */
  private createDefaultPromptLoader(): PromptLoader {
    const promptsDir = path.join(process.cwd(), 'prompts');
    return new PromptLoader(promptsDir);
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
   *
   * Loads the prompt template from the configuration file and substitutes
   * the sutra variable.
   */
  private buildPrompt(sutra: string): string {
    return this.promptLoader.buildPrompt('sanskrit-translation', { sutra });
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
