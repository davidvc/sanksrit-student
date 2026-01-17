# Test Design: Sanskrit Translation Service

## Overview

This document describes the testing strategy for both local development and verifying deployed environments. Tests use a **mock LLM by default** to ensure fast, deterministic, cost-free testing.

## Core Principles

1. **Mock by Default** - All acceptance tests run against a mock LLM adapter
2. **Test After Every Change** - Acceptance tests run on every commit/change
3. **No API Key Required** - Developers can run all acceptance tests without an Anthropic API key
4. **Test Business Logic** - TranslationService contains testable business logic, isolated from LLM

## Architecture for Testability

The system uses hexagonal architecture with a port for LLM interaction:

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
└─────────────────┘       └─────────────────┘
```

**Key points:**
- `TranslationService` contains our business logic (parsing, formatting, validation)
- `LlmClient` is the port that abstracts LLM interaction
- Tests inject `MockLlmClient`, production uses `ClaudeLlmClient`
- Business logic in `TranslationService` is fully testable without any LLM calls

## Test Categories

### 1. Acceptance Tests (Primary)

Acceptance tests verify the full system behavior using the mock LLM adapter.

**Location:** `tests/acceptance/`

**What they test:**
- GraphQL query structure and response format
- TranslationService business logic
- Word-by-word breakdown contains required fields
- Grammatical forms and meanings are present
- Error handling for invalid input

**Execution:**
- Run after every change
- Fast, no external dependencies
- No API key required

### 2. Integration Tests (Pre-Production)

A small number of integration tests verify correct integration with the real LLM. These are automated and run as part of any production deployment.

**Location:** `tests/integration/`

**What they test:**
- ClaudeLlmClient correctly calls the Anthropic API
- Response parsing works with real LLM output
- Basic end-to-end flow with real LLM

**Execution:**
- Automated, runs before every production deploy
- Requires `ANTHROPIC_API_KEY`
- Kept minimal to control costs (only a few tests)

### 3. Unit Tests (As Needed)

Unit tests for complex logic that benefits from isolation.

**Location:** `tests/unit/`

**When to use:**
- Complex parsing or transformation logic in TranslationService
- Error handling edge cases

## Mock LLM Implementation

### MockLlmClient

The mock adapter returns pre-defined responses for known test sutras:

```typescript
// src/adapters/mock-llm-client.ts

export class MockLlmClient implements LlmClient {
  private stubbedResponses: Map<string, LlmResponse>;

  async translate(sutra: string): Promise<LlmResponse> {
    return this.stubbedResponses.get(sutra) ?? this.genericResponse(sutra);
  }
}
```

### Stubbed Responses

```typescript
const stubbedResponses = {
  'atha yogānuśāsanam': {
    words: [
      {
        word: 'atha',
        grammaticalForm: 'indeclinable particle',
        meanings: ['now', 'thus', 'hence']
      },
      {
        word: 'yogānuśāsanam',
        grammaticalForm: 'nominative singular neuter compound',
        meanings: ['instruction on yoga', 'teaching of yoga']
      }
    ]
  }
  // Additional stubbed sutras...
};
```

### Handling Unknown Input

For sutras not in the stub list, the mock returns a generic valid response structure. This allows testing with arbitrary input while maintaining response format consistency.

## Local Testing

### Prerequisites

1. **Node.js** (v18 or later)
2. No API key required

### Environment Setup

```bash
# Install dependencies
npm install
```

### Running Tests

```bash
# Run all acceptance tests (uses mock LLM, no API key needed)
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/acceptance/word-translation.test.ts
```

### Running Integration Tests Locally

Integration tests run automatically in CI before production deploys, but can also be run locally:

```bash
# Set API key for real LLM tests
export ANTHROPIC_API_KEY="your-api-key-here"

# Run integration tests
npm run test:integration
```

## Testing Deployed Service

### Smoke Tests

After deployment, verify the service is operational with quick checks.

**Manual verification using curl:**

```bash
curl -X POST https://your-app.vercel.app/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { translateSutra(sutra: \"atha yogānuśāsanam\") { originalText words { word grammaticalForm meanings } } }"
  }'
```

### Health Check Endpoint

The deployed service exposes a health check:

```
GET /health
```

Returns `200 OK` with `{"status": "healthy"}` when operational.

## Test Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For integration tests and production | API key for Claude |
| `GRAPHQL_ENDPOINT` | No | Override endpoint for deployed testing |

### vitest.config.ts

- Node environment
- Test files in `tests/**/*.test.ts`
- Excludes `tests/integration/` from default test run

## Standard Test Data

### Test Sutras with Stubbed Responses

| Sutra | Source | Mock Response Summary |
|-------|--------|----------------------|
| `atha yogānuśāsanam` | Yoga Sutras 1.1 | 2 words: atha (particle), yogānuśāsanam (compound) |
| `yogaś citta-vṛtti-nirodhaḥ` | Yoga Sutras 1.2 | 4 words with sandhi handling |
| `tadā draṣṭuḥ svarūpe 'vasthānam` | Yoga Sutras 1.3 | 4 words |

### Adding New Test Cases

1. Add the sutra and expected response to `src/adapters/mock-llm-client.ts`
2. Write the acceptance test using that sutra
3. The mock will return the stubbed response

## CI/CD

### Every Change (PR/Commit)

```yaml
- npm install
- npm test          # Acceptance tests with mock (fast, free, no API key)
- npm run build     # Type check and build
```

### Production Deployment

```yaml
- npm install
- npm test                  # Acceptance tests (mock)
- npm run build
- npm run test:integration  # Integration tests with real LLM (requires ANTHROPIC_API_KEY)
- deploy to production
```

Integration tests run automatically before any production deploy to verify LLM integration is working correctly.
