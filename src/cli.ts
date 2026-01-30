import { LlmTranslationService } from './adapters/llm-translation-service';
import { NormalizingTranslationService } from './adapters/normalizing-translation-service';
import { MockLlmClient } from './adapters/mock-llm-client';
import { LlmClient } from './domain/llm-client';
import { ScriptDetectorImpl } from './domain/script-detector';
import { ScriptNormalizerImpl } from './domain/script-normalizer';
import { SanscriptConverter } from './adapters/sanscript-converter';
import { TranslationService } from './domain/translation-service';

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
async function createClient(useMock: boolean): Promise<LlmClient> {
  if (useMock) {
    return new MockLlmClient();
  }
  // Lazy load Claude client only when needed
  const { ClaudeLlmClient } = await import('./adapters/claude-llm-client.js');
  return new ClaudeLlmClient();
}

/**
 * Creates a translation service with Devanagari support.
 */
async function createTranslationService(useMock: boolean): Promise<TranslationService> {
  const client = await createClient(useMock);
  const baseService = new LlmTranslationService(client);
  const detector = new ScriptDetectorImpl();
  const converter = new SanscriptConverter();
  const normalizer = new ScriptNormalizerImpl(detector, converter);
  return new NormalizingTranslationService(normalizer, baseService);
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

  const service = await createTranslationService(useMock);
  const result = await service.translate(sutra);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
