import { LlmTranslationService } from './adapters/llm-translation-service';
import { MockLlmClient } from './adapters/mock-llm-client';
import { LlmClient } from './domain/llm-client';

/**
 * Parses command-line arguments and returns configuration.
 */
function parseArgs(args: string[]): { useMock: boolean; sutra: string | null } {
  const useMock = args.includes('--mock');
  const filteredArgs = args.filter(arg => arg !== '--mock');
  const sutra = filteredArgs.length > 0 ? filteredArgs.join(' ') : null;
  return { useMock, sutra };
}

/**
 * Creates the appropriate LLM client based on configuration.
 */
function createClient(useMock: boolean): LlmClient {
  if (useMock) {
    return new MockLlmClient();
  }
  // Lazy load Claude client only when needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ClaudeLlmClient } = require('./adapters/claude-llm-client');
  return new ClaudeLlmClient();
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { useMock, sutra } = parseArgs(args);

  if (!sutra) {
    console.error('Error: Missing required sutra argument');
    console.error('Usage: ./translate [--mock] "sutra text"');
    process.exit(1);
  }

  const client = createClient(useMock);
  const service = new LlmTranslationService(client);

  const result = await service.translate(sutra);
  console.log(JSON.stringify(result));
}

main().catch((error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
