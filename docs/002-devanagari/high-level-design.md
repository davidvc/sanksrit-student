# High-Level Design: Devanagari Script Input Support

## Overview

Extend the existing translation service to accept Sanskrit text in Devanagari script, in addition to IAST transliteration. The system will auto-detect the input script and normalize it before translation.

## Architecture Decisions

### Approach: Pre-LLM Script Normalization

**Rationale:**
- Keeps LLM prompts consistent (always receive IAST)
- Devanagari-to-IAST conversion is deterministic and well-defined
- Easier to test—conversion logic is isolated from LLM behavior
- Follows Open-Closed Principle: existing translation logic unchanged

**Alternative considered:** Let the LLM handle Devanagari directly
- Rejected because: less predictable results, harder to test, prompt complexity increases

### Script Detection: Unicode Range Check

**Rationale:**
- Devanagari Unicode block (U+0900–U+097F) is distinct from Latin characters
- Simple, fast, and deterministic
- No external dependencies required

### Conversion Library: `@indic-transliteration/sanscript`

**Choice:** `@indic-transliteration/sanscript`

**Rationale:**
- Devanagari-to-IAST mapping is standardized but non-trivial (vowel marks, conjuncts, etc.)
- Sanscript is a widely-used, battle-tested transliteration library
- Lightweight with no additional dependencies
- Avoids reinventing complex transliteration rules

### Script Conversion as a Port

**Rationale:**
- The conversion library is an external dependency that may change
- Following hexagonal architecture, we define a port (interface) in the domain layer
- The specific library implementation is an adapter that can be swapped without impacting business logic
- Enables easy testing with a mock converter if needed

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│                 (CLI, GraphQL, Future Web UI)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   GraphQL API Layer                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Script Normalizer  [NEW]                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Detect script (Devanagari, IAST, or mixed)         │ │
│  │  2. If mixed → return error                            │ │
│  │  3. If Devanagari → convert to IAST                    │ │
│  │  4. Pass normalized IAST to Translation Service        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ (IAST only)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Translation Service                          │
│           (Unchanged - always receives IAST)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  LLM Client (Claude)                        │
└─────────────────────────────────────────────────────────────┘
```

## New Components

### ScriptDetector

Determines the script type of input text.

```typescript
type ScriptType = 'devanagari' | 'iast' | 'mixed';

interface ScriptDetector {
  detect(text: string): ScriptType;
}
```

**Implementation:**
- Scan each character's Unicode code point
- Devanagari: U+0900–U+097F
- IAST: Latin characters (with or without diacritics)
- Mixed: both present → error case

### ScriptConverter (Port)

Defines the contract for script conversion. This is a port in the hexagonal architecture sense—the domain depends on this interface, not on any specific library.

```typescript
interface ScriptConverter {
  toIast(devanagari: string): string;
}
```

**Adapter implementation:** `SanscriptConverter` wraps `@indic-transliteration/sanscript` and implements this interface. If we later need to switch libraries, we only change the adapter.

### ScriptNormalizer

Orchestrates detection and conversion. Depends on `ScriptDetector` and `ScriptConverter` interfaces.

```typescript
interface ScriptNormalizer {
  normalize(text: string): NormalizationResult;
}

type NormalizationResult =
  | { success: true; iast: string; originalScript: ScriptType }
  | { success: false; error: string };
```

**Implementation:**
- Uses ScriptDetector to determine input type
- If Devanagari, converts using injected ScriptConverter
- If IAST, passes through unchanged
- If mixed, returns error

### Integration Point

The ScriptNormalizer wraps the existing TranslationService:

```typescript
class NormalizingTranslationService implements TranslationService {
  constructor(
    private normalizer: ScriptNormalizer,
    private delegate: TranslationService
  ) {}

  async translateSutra(sutra: string): Promise<TranslationResult> {
    const normalized = this.normalizer.normalize(sutra);
    if (!normalized.success) {
      throw new TranslationError(normalized.error);
    }
    const result = await this.delegate.translateSutra(normalized.iast);
    // Preserve original text in response
    return { ...result, originalText: sutra };
  }
}
```

## Key Dependencies

**New:**
- `@indic-transliteration/sanscript` - Devanagari to IAST conversion

**Existing (unchanged):**
- `graphql-yoga` - GraphQL server
- `@anthropic-ai/sdk` - Claude API client
- `vitest` - Testing framework

## Testing Strategy

See [test-plan.md](./test-plan.md) for detailed acceptance test specifications.

## File Structure

```
src/
├── domain/
│   ├── script-converter.ts     [NEW] - Port interface
│   ├── script-detector.ts      [NEW]
│   └── script-normalizer.ts    [NEW]
├── adapters/
│   ├── sanscript-converter.ts  [NEW] - Adapter: implements ScriptConverter using sanscript library
│   └── normalizing-translation-service.ts [NEW]
```

## Rollout Plan

1. Add script detection logic with tests
2. Add Devanagari-to-IAST conversion with tests
3. Create NormalizingTranslationService wrapper
4. Wire up in dependency injection (server.ts, cli.ts)
5. Add acceptance tests with Devanagari input
6. Update mock client with Devanagari test cases
