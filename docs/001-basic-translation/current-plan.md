# Implementation Plan: Word-by-Word Translation

## Goal

Make the acceptance test pass by implementing the `translateSutra` GraphQL resolver that returns word-by-word breakdowns with grammatical forms and meanings.

## Architecture Approach

Following hexagonal architecture to separate concerns:

```
┌─────────────────────────────────────────────────────┐
│                  GraphQL Resolver                    │
│               (src/server.ts)                        │
└──────────────────────┬──────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────┐
│              TranslationService                      │
│           (port/interface)                           │
│         src/domain/translation-service.ts            │
└──────────────────────┬──────────────────────────────┘
                       │ implemented by
                       ▼
┌─────────────────────────────────────────────────────┐
│           LlmTranslationService                      │
│              (adapter)                               │
│      src/adapters/llm-translation-service.ts         │
└──────────────────────┬──────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────┐
│              Anthropic SDK                           │
│            (external dependency)                     │
└─────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Define domain types

Create TypeScript types that represent the translation result structure. These are pure domain types with no external dependencies.

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

### Step 2: Define TranslationService interface (port)

Create an interface that defines the contract for translation services. This allows us to swap implementations (e.g., mock for testing, LLM for production).

**File:** `src/domain/translation-service.ts`

```typescript
export interface TranslationService {
  translateSutra(sutra: string): Promise<TranslationResult>;
}
```

### Step 3: Implement LlmTranslationService (adapter)

Create the Claude-powered implementation that:
- Sends the sutra to Claude with a structured prompt
- Parses the response into our domain types
- Handles errors gracefully

**File:** `src/adapters/llm-translation-service.ts`

Key responsibilities:
- Construct prompt that asks Claude for word-by-word breakdown
- Use structured output or JSON parsing to get reliable response format
- Map LLM response to `TranslationResult` type

### Step 4: Wire up the GraphQL resolver

Update the server to:
- Accept a `TranslationService` via dependency injection
- Create a factory function that wires up the real implementation
- Call the service in the resolver

**File:** `src/server.ts` (modify existing)

### Step 5: Run acceptance test and verify it passes

Execute `npm test` and confirm the test passes with the real LLM integration.

## Dependencies Between Steps

```
Step 1 (types) ─────┐
                    ├──→ Step 3 (LLM adapter) ──→ Step 4 (wire up) ──→ Step 5 (verify)
Step 2 (interface) ─┘
```

- Steps 1 and 2 have no dependencies and can be done first (in either order)
- Step 3 depends on Steps 1 and 2
- Step 4 depends on Step 3
- Step 5 depends on Step 4

## Testing Notes

- The acceptance test will call the real LLM (requires `ANTHROPIC_API_KEY` env var)
- For CI/future, we may want to add a mock implementation, but that's out of scope for this task

## Environment Requirements

- `ANTHROPIC_API_KEY` environment variable must be set to run the acceptance test
