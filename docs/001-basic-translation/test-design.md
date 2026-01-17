# Test Design: Sanskrit Translation Service

## Overview

This document describes the testing strategy for both local development and verifying deployed environments.

## Test Categories

### 1. Acceptance Tests (Primary)

Acceptance tests verify the GraphQL API contract. They are the primary means of ensuring the system works correctly.

**Location:** `tests/acceptance/`

**What they test:**
- GraphQL query structure and response format
- Word-by-word breakdown contains required fields
- Grammatical forms and meanings are present

**Execution:** These tests call the real LLM, so they require an API key and incur costs.

### 2. Unit Tests (As Needed)

Unit tests are used sparingly for complex logic that benefits from isolation.

**Location:** `tests/unit/` (created as needed)

**When to use:**
- Complex parsing or transformation logic
- Error handling edge cases
- Business rules that are difficult to test at acceptance level

## Local Testing

### Prerequisites

1. **Node.js** (v18 or later)
2. **Anthropic API Key** set as environment variable

### Environment Setup

```bash
# Install dependencies
npm install

# Set API key (required for acceptance tests)
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run specific test file
npx vitest run tests/acceptance/word-translation.test.ts
```

### Test Output

Tests use vitest and output results to the console. A failing test will show:
- The assertion that failed
- Expected vs actual values
- Stack trace pointing to the failing line

## Testing Deployed Service

### Smoke Tests

After deployment, run smoke tests to verify the service is operational.

**Approach:** Use the same acceptance tests but point them at the deployed endpoint.

```bash
# Set the deployed endpoint URL
export GRAPHQL_ENDPOINT="https://your-app.vercel.app/graphql"

# Run smoke tests
npm run test:smoke
```

### Manual Verification

For quick verification, use curl or a GraphQL client:

```bash
curl -X POST https://your-app.vercel.app/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { translateSutra(sutra: \"atha yogānuśāsanam\") { originalText words { word grammaticalForm meanings } } }"
  }'
```

### Health Check Endpoint

The deployed service should expose a health check endpoint for monitoring:

```
GET /health
```

Returns `200 OK` with `{"status": "healthy"}` when the service is operational.

## Test Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for acceptance tests) | API key for Claude |
| `GRAPHQL_ENDPOINT` | No | Override endpoint for deployed testing (defaults to local test server) |

### vitest.config.ts

The test configuration includes:
- 30-second timeout for LLM calls
- Node environment
- Test files in `tests/**/*.test.ts`

## CI/CD Considerations

### Cost Management

Since acceptance tests call the real LLM:
- Run acceptance tests only on PR merge (not every commit)
- Consider a mock LLM implementation for rapid iteration on non-LLM code
- Monitor API usage and costs

### Future: Mock Implementation

For faster CI feedback, we may add a `MockTranslationService` that returns canned responses. This would allow:
- Fast tests for GraphQL schema validation
- Testing error handling paths
- Running tests without API key

The acceptance tests would then have two modes:
- `npm test` - Uses mock (fast, no API key needed)
- `npm run test:integration` - Uses real LLM (slower, requires API key)

## Test Data

### Standard Test Sutras

Use these sutras for consistent testing:

| Sutra | Source | Notes |
|-------|--------|-------|
| `atha yogānuśāsanam` | Yoga Sutras 1.1 | Simple, 2 words |
| `yogaś citta-vṛtti-nirodhaḥ` | Yoga Sutras 1.2 | Contains sandhi |
| `tadā draṣṭuḥ svarūpe 'vasthānam` | Yoga Sutras 1.3 | Multiple words with apostrophe |

### Expected Behavior

For `atha yogānuśāsanam`, expect:
- 2 word entries (or 3 if compound is split)
- Each word has non-empty `grammaticalForm`
- Each word has at least one meaning
