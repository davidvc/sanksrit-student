# Implementation Plan: Word-by-Word Translation

## Goal

Make the acceptance test pass by implementing the `translateSutra` GraphQL resolver that returns word-by-word breakdowns with grammatical forms and meanings.

## Architecture Approach

Following hexagonal architecture. The TranslationService contains our business logic and uses an LlmClient port to abstract LLM interaction. Tests inject a mock adapter.

```
┌─────────────────────────────────────────────────────┐
│                  GraphQL Resolver                    │
│               (src/server.ts)                        │
└──────────────────────┬──────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────┐
│              TranslationService                      │
│         (our business logic - testable)              │
│         src/domain/translation-service.ts            │
└──────────────────────┬──────────────────────────────┘
                       │ uses (via port)
                       ▼
┌─────────────────────────────────────────────────────┐
│                   LlmClient                          │
│              (port/interface)                        │
│            src/domain/llm-client.ts                  │
└──────────────────────┬──────────────────────────────┘
                       │ implemented by
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────┐
│  MockLlmClient  │       │ ClaudeLlmClient │
│   (for tests)   │       │ (for production)│
│ src/adapters/   │       │ src/adapters/   │
└─────────────────┘       └─────────────────┘
```

## Implementation Steps

### Step 1: Define domain types

Create TypeScript types that represent the translation result structure and LLM response.

**File:** `src/domain/types.ts`

```typescript
export interface WordEntry {
  word: string;
  grammaticalForm: string;
  meanings: string[];
}

export interface TranslationResult {
  originalText: string;
  words: WordEntry[];
}
```

### Step 2: Define LlmClient interface (port)

Create the port interface that abstracts LLM interaction. This allows swapping mock and real implementations.

**File:** `src/domain/llm-client.ts`

```typescript
export interface LlmClient {
  translateSutra(sutra: string): Promise<LlmTranslationResponse>;
}

export interface LlmTranslationResponse {
  words: Array<{
    word: string;
    grammaticalForm: string;
    meanings: string[];
  }>;
}
```

### Step 3: Implement MockLlmClient (adapter for tests)

Create a mock implementation that returns stubbed responses for known test sutras.

**File:** `src/adapters/mock-llm-client.ts`

Key responsibilities:
- Return pre-defined responses for standard test sutras
- Return a generic valid response for unknown input
- No external dependencies

### Step 4: Implement TranslationService (business logic)

Create the service that contains our business logic. It uses LlmClient to get raw translation data and transforms it into the final result.

**File:** `src/domain/translation-service.ts`

```typescript
export class TranslationService {
  constructor(private llmClient: LlmClient) {}

  async translateSutra(sutra: string): Promise<TranslationResult> {
    const llmResponse = await this.llmClient.translateSutra(sutra);
    // Business logic: validation, transformation, etc.
    return {
      originalText: sutra,
      words: llmResponse.words,
    };
  }
}
```

### Step 5: Wire up the GraphQL resolver

Update the server to:
- Accept an LlmClient via dependency injection
- Create TranslationService with the injected client
- Provide factory functions for test (mock) and production (Claude) configurations

**File:** `src/server.ts` (modify existing)

### Step 6: Run acceptance test and verify it passes

Execute `npm test` and confirm the test passes with the mock implementation.

### Step 7: Implement ClaudeLlmClient (adapter for production)

Create the Claude-powered implementation.

**File:** `src/adapters/claude-llm-client.ts`

Key responsibilities:
- Construct prompt that asks Claude for word-by-word breakdown
- Parse response into LlmTranslationResponse format
- Handle errors gracefully

## Dependencies Between Steps

```
Step 1 (types) ─────┐
                    ├──→ Step 3 (mock) ──┐
Step 2 (LlmClient)──┤                    ├──→ Step 5 (wire up) ──→ Step 6 (verify)
                    └──→ Step 4 (service)┘
                    │
                    └──→ Step 7 (Claude adapter) - can be done after Step 6
```

- Steps 1 and 2 have no dependencies
- Step 3 (mock) depends on Step 2
- Step 4 (service) depends on Steps 1 and 2
- Step 5 (wire up) depends on Steps 3 and 4
- Step 6 (verify) depends on Step 5
- Step 7 (Claude) depends on Step 2, but can be done after tests pass

## Testing Notes

- Acceptance tests use `MockLlmClient` - no API key required
- Tests run after every change
- TranslationService business logic is fully testable
- Optional integration tests can verify real LLM behavior (see test-design.md)

## Environment Requirements

- Node.js v18+
- No API key required for acceptance tests
- `ANTHROPIC_API_KEY` only needed for production deployment or integration tests
