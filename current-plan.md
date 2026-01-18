# CLI for Sanskrit Translation System

## Goal

Provide a command-line interface for users to translate Sanskrit sutras and view word-by-word breakdowns.

## User Steps

1. User invokes the CLI with a Sanskrit sutra as input
2. System translates the sutra using the Claude LLM
3. System displays the translation result as JSON

## CLI Interface

```bash
# Production usage (requires ANTHROPIC_API_KEY)
npm run translate "yogaś citta-vṛtti-nirodhaḥ"

# Mock mode for testing
npm run translate -- --mock "yogaś citta-vṛtti-nirodhaḥ"
```

## Example Output

```json
{
  "originalText": "yogaś citta-vṛtti-nirodhaḥ",
  "words": [
    {
      "word": "yogaḥ",
      "grammaticalForm": "noun, masculine, nominative, singular",
      "meanings": ["yoga", "union", "discipline"]
    },
    {
      "word": "citta",
      "grammaticalForm": "noun, neuter, compound element",
      "meanings": ["mind", "consciousness", "thought"]
    },
    {
      "word": "vṛtti",
      "grammaticalForm": "noun, feminine, compound element",
      "meanings": ["fluctuation", "modification", "activity"]
    },
    {
      "word": "nirodhaḥ",
      "grammaticalForm": "noun, masculine, nominative, singular",
      "meanings": ["cessation", "restraint", "control"]
    }
  ]
}
```

## Implementation

Create a CLI script that:
1. Parses command-line arguments for `--mock` flag and sutra text
2. Instantiates MockLlmClient (if --mock) or ClaudeLlmClient (default)
3. Creates LlmTranslationService with the chosen client
4. Calls translate() and outputs result as JSON

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/cli.ts` | Create | Main CLI entry point |
| `package.json` | Modify | Add `translate` script |
| `tests/acceptance/cli.test.ts` | Create | CLI acceptance tests |

## Testing Strategy

Acceptance tests will verify the CLI correctly invokes the translation service using mock mode:

1. **Basic invocation** - CLI with --mock flag returns valid JSON output
2. **Missing sutra argument** - CLI shows error when no sutra provided
3. **Output structure** - Verify JSON contains originalText and words array with expected fields

Tests will execute the CLI as a subprocess and parse JSON stdout, ensuring the full CLI flow works end-to-end.

## Acceptance Criteria

- [ ] CLI accepts a Sanskrit sutra as command-line argument
- [ ] CLI supports `--mock` flag to use MockLlmClient
- [ ] CLI outputs TranslationResult as JSON
- [ ] CLI uses ClaudeLlmClient by default (requires ANTHROPIC_API_KEY)
- [ ] CLI shows helpful error if sutra not provided
- [ ] Acceptance tests pass using --mock mode
