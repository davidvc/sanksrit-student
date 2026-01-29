# High-Level Design: Hybrid Translation Approach Using Dictionary APIs and LLM

## Overview

This feature enhances the existing Sanskrit translation system by integrating authoritative dictionary data from C-SALT APIs alongside the existing LLM-based translation. The hybrid approach provides students with both scholarly dictionary definitions and contextual LLM analysis in a single, cohesive response.

## Architecture Overview

### Current Architecture (LLM-Only)

```
┌─────────────┐
│   GraphQL   │
│   Resolver  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ TranslationService   │
│ (LlmTranslationSvc)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│    LlmClient         │
│  (ClaudeLlmClient)   │
└──────────────────────┘
```

### New Architecture (Hybrid)

```
┌─────────────┐
│   GraphQL   │
│   Resolver  │
└──────┬──────┘
       │
       ▼
┌────────────────────────────┐
│   TranslationService       │
│ (HybridTranslationService) │ ◄── NEW
└───┬────────────────────┬───┘
    │                    │
    ▼                    ▼
┌─────────────┐   ┌──────────────────┐
│  LlmClient  │   │ DictionaryClient │ ◄── NEW
└─────────────┘   └──────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  C-SALT API  │ ◄── External
                  └──────────────┘
```

## Key Components

### 1. HybridTranslationService (NEW)

**Purpose**: Orchestrates both LLM and dictionary lookups to produce a unified translation result.

**Responsibilities**:
- Accept IAST transliteration input
- Call LLM for word translations and contextual notes
- Call Dictionary API for authoritative definitions
- Merge both data sources into enhanced WordEntry objects
- Handle fallback when either service is unavailable
- Return enhanced TranslationResult

**Interface**:
```typescript
class HybridTranslationService implements TranslationService {
  constructor(
    private llmClient: LlmClient,
    private dictionaryClient: DictionaryClient
  )

  async translate(sutra: string): Promise<TranslationResult>
}
```

### 2. DictionaryClient (NEW - Port Interface)

**Purpose**: Abstract interface for dictionary lookup operations.

**Responsibilities**:
- Define contract for dictionary lookups
- Allow different implementations (C-SALT, mock, etc.)

**Interface**:
```typescript
interface DictionaryClient {
  lookupWord(word: string): Promise<DictionaryDefinition[]>
  lookupWords(words: string[]): Promise<Map<string, DictionaryDefinition[]>>
}

interface DictionaryDefinition {
  source: string      // e.g., "PWG Dictionary"
  definition: string  // Definition text
}
```

### 3. CSaltDictionaryClient (NEW - Adapter)

**Purpose**: Concrete implementation that calls C-SALT APIs.

**Responsibilities**:
- Make HTTP requests to C-SALT GraphQL or REST endpoints
- Parse responses into DictionaryDefinition objects
- Handle API errors and timeouts
- Query multiple dictionaries (PWG, Buddhist Hybrid Sanskrit, etc.)

**Interface**:
```typescript
class CSaltDictionaryClient implements DictionaryClient {
  constructor(
    private apiEndpoint: string,
    private dictionaries: string[]  // e.g., ["PWG", "BHS"]
  )

  async lookupWord(word: string): Promise<DictionaryDefinition[]>
  async lookupWords(words: string[]): Promise<Map<string, DictionaryDefinition[]>>
}
```

### 4. Enhanced WordEntry (Type Extension)

**Purpose**: Extend existing WordEntry to include dictionary data and contextual notes.

**Changes to `src/domain/types.ts`**:
```typescript
interface DictionaryDefinition {
  source: string
  definition: string
}

interface WordEntry {
  word: string
  meanings: string[]                           // EXISTING (LLM translations)
  dictionaryDefinitions?: DictionaryDefinition[] // NEW
  contextualNote?: string                        // NEW
}

interface TranslationResult {
  originalText: string
  iastText: string
  words: WordEntry[]
  alternativeTranslations?: string[]
  warnings?: string[]  // NEW - for degraded mode
}
```

### 5. Enhanced LLM Prompts (Adapter Changes)

**Purpose**: Update LLM prompts to request contextual notes and compound word breakdown.

**Changes to prompts**:
- Request plain-English contextual explanations (not technical grammar)
- Request identification of compound word boundaries
- Request each component of compounds as separate word entries
- Ensure output matches enhanced WordEntry structure

## Data Flow

### Happy Path (Both Services Available)

**IMPORTANT**: LLM must execute FIRST, then dictionary lookup uses LLM's word list. They cannot run in true parallel because we need the LLM's word breakdown to know which words to look up in the dictionary.

```
1. User requests translation of "yogaś citta-vṛtti-nirodhaḥ"
   ↓
2. HybridTranslationService.translate() called
   ↓
3. Call LlmClient.translateSutra() → MUST HAPPEN FIRST
   ↓
4. LLM returns:
   - words: [
       {word: "yogaḥ", meanings: ["yoga"], contextualNote: "The subject..."},
       {word: "citta", meanings: ["mind"], contextualNote: "Combines with..."},
       {word: "vṛtti", meanings: ["fluctuations"], contextualNote: "Completes..."},
       {word: "nirodhaḥ", meanings: ["cessation"], contextualNote: "What yoga IS..."}
     ]
   - alternativeTranslations: ["Yoga is the cessation..."]
   ↓
5. Extract word list from LLM response: ["yogaḥ", "citta", "vṛtti", "nirodhaḥ"]
   ↓
6. Call DictionaryClient.lookupWords(["yogaḥ", "citta", "vṛtti", "nirodhaḥ"]) → HAPPENS SECOND
   ↓
7. Dictionary returns Map:
   - "yogaḥ" → [{source: "PWG", definition: "union, joining..."}]
   - "citta" → [{source: "PWG", definition: "thought, mind..."}]
   - "vṛtti" → [{source: "PWG", definition: "turning, rolling..."}]
   - "nirodhaḥ" → [{source: "PWG", definition: "confinement, locking up..."}]
   ↓
8. Merge: For each word, add dictionaryDefinitions to WordEntry
   ↓
9. Return enhanced TranslationResult
```

**Execution Order Summary**:
- **Step 1**: Call LLM (get word breakdown and compound analysis)
- **Step 2**: Use LLM's word list to call dictionary API
- **Step 3**: Merge both results

**Why not parallel?** We depend on the LLM to tell us which words exist (especially for compound word breakdown). Without the LLM's analysis, we wouldn't know to look up "citta" and "vṛtti" separately instead of "citta-vṛtti" as one word.

### Fallback Path (Dictionary API Down)

```
1. HybridTranslationService.translate() called
   ↓
2. Call LlmClient.translateSutra() → Success
3. Call DictionaryClient.lookupWords() → Timeout/Error
   ↓
4. Catch dictionary error
   ↓
5. Return TranslationResult with:
   - words from LLM (no dictionaryDefinitions)
   - warnings: ["Dictionary API unavailable - showing LLM-only translations"]
```

### Fallback Path (LLM Down)

```
1. HybridTranslationService.translate() called
   ↓
2. Call LlmClient.translateSutra() → Timeout/Error
   ↓
3. Catch LLM error
   ↓
4. Parse input sutra to extract individual words (basic tokenization)
   ↓
5. Call DictionaryClient.lookupWords() → Success
   ↓
6. Return TranslationResult with:
   - words with only dictionaryDefinitions (no meanings or contextualNote)
   - warnings: ["LLM unavailable - showing dictionary-only definitions"]
```

## API Changes

### GraphQL Schema (No Breaking Changes)

The existing GraphQL schema does NOT need to change. The `TranslationResult` type already supports optional fields, so we can add the new data transparently:

```graphql
type WordEntry {
  word: String!
  meanings: [String!]!                    # EXISTING (LLM)
  dictionaryDefinitions: [DictionaryDef!] # NEW (optional)
  contextualNote: String                  # NEW (optional)
}

type DictionaryDef {
  source: String!
  definition: String!
}

type TranslationResult {
  originalText: String!
  iastText: String!
  words: [WordEntry!]!
  alternativeTranslations: [String!]
  warnings: [String!]  # NEW
}
```

Clients will receive the new fields automatically without requiring changes.

## Dependencies

### External Dependencies

1. **C-SALT Dictionary APIs**
   - **Endpoint**: `https://api.c-salt.uni-koeln.de/`
   - **Protocol**: GraphQL or REST (TBD during implementation)
   - **Authentication**: Check if API key required
   - **Rate Limits**: Check documentation for limits
   - **Dictionaries to Query**:
     - PWG Sanskrit Dictionary (primary)
     - Buddhist Hybrid Sanskrit Grammar and Dictionary
     - Vedic Index of Names and Subjects (optional)

2. **HTTP Client Library**
   - Likely `node-fetch` or `axios` (check existing dependencies)
   - For making API calls to C-SALT

### Internal Dependencies

1. **Existing LlmClient** - Continue using for LLM translations
2. **Existing TranslationService interface** - HybridTranslationService implements this
3. **Prompt updates** - Modify prompts to request contextual notes

## Configuration

### Environment Variables (NEW)

```bash
# C-SALT Dictionary API Configuration
CSALT_API_ENDPOINT=https://api.c-salt.uni-koeln.de/
CSALT_API_KEY=<optional-key-if-required>
CSALT_DICTIONARIES=PWG,BHS  # Comma-separated list
CSALT_TIMEOUT_MS=5000       # Timeout for dictionary lookups
```

### Dependency Injection

Update application initialization to wire up the new service:

```typescript
// Before (LLM-only)
const llmClient = new ClaudeLlmClient(...)
const translationService = new LlmTranslationService(llmClient)

// After (Hybrid)
const llmClient = new ClaudeLlmClient(...)
const dictionaryClient = new CSaltDictionaryClient(
  process.env.CSALT_API_ENDPOINT,
  process.env.CSALT_DICTIONARIES.split(',')
)
const translationService = new HybridTranslationService(
  llmClient,
  dictionaryClient
)
```

## Risks and Mitigations

### Risk 1: C-SALT API Availability

**Risk**: External dictionary API may be unavailable or slow.

**Mitigation**:
- Implement automatic fallback to LLM-only mode
- Set reasonable timeout (5 seconds per word)
- Return partial results if some dictionary lookups fail
- Include warnings in response to inform users

### Risk 2: Dictionary API Rate Limits

**Risk**: C-SALT may have rate limits that slow down or block requests.

**Mitigation**:
- Research rate limits during implementation
- Batch word lookups when possible (use `lookupWords()` not individual calls)
- Consider implementing request throttling if needed
- Future: Add caching layer if rate limits become problematic (not in initial implementation)

### Risk 3: Word Form Mismatches

**Risk**: Dictionary API expects root forms (lemmas), but input contains inflected forms (e.g., "yogaḥ" vs "yoga").

**Mitigation**:
- Try exact match first
- If no results, try removing common case endings (ḥ, m, etc.)
- LLM contextual note can explain why dictionary definition might not match perfectly
- Document this limitation in the implementation

### Risk 4: Compound Word Complexity

**Risk**: LLM may not always correctly identify compound boundaries.

**Mitigation**:
- Trust LLM's compound analysis (it's contextual)
- Show each component as separate entry even if imperfect
- Dictionary lookups will validate if components are real words
- Students benefit from seeing the breakdown attempt even if not 100% accurate

### Risk 5: Breaking Existing Clients

**Risk**: Adding new fields might break existing GraphQL clients.

**Mitigation**:
- All new fields are optional (nullable)
- Existing clients will ignore new fields
- No changes to required fields
- Backward compatible by design

## Implementation Plan - TDD Cycles

### Preparation Phase

**Before writing any tests:**
1. Research C-SALT API documentation
2. Determine GraphQL vs REST endpoint
3. Test manual API calls (curl/Postman)
4. Document API response format

### TDD Cycle 1: Dictionary Client Interface & Mock

**Acceptance Criteria Covered**:
- "Dictionary API integration successfully retrieves word definitions"
- "All dictionary definitions include source attribution"

**RED** (Write failing tests):
```typescript
// tests/unit/dictionary-client.test.ts
describe('DictionaryClient', () => {
  it('should return dictionary definitions with source attribution', async () => {
    const client = new MockDictionaryClient()
    const results = await client.lookupWord('yoga')

    expect(results).toHaveLength(1)
    expect(results[0]).toHaveProperty('source', 'PWG Dictionary')
    expect(results[0]).toHaveProperty('definition')
    expect(results[0].definition).toContain('union')
  })
})
```

**GREEN** (Implement):
- Create `DictionaryClient` interface
- Create `MockDictionaryClient` implementation
- Make tests pass

**REFACTOR**:
- Clean up interface documentation
- Add type safety

### TDD Cycle 2: C-SALT API Client

**Acceptance Criteria Covered**:
- "Multiple dictionary sources are consulted (PWG, Buddhist Hybrid Sanskrit, etc.)"

**RED** (Write failing tests):
```typescript
// tests/integration/csalt-dictionary-client.test.ts
describe('CSaltDictionaryClient', () => {
  it('should query multiple dictionaries', async () => {
    const client = new CSaltDictionaryClient(apiEndpoint, ['PWG', 'BHS'])
    const results = await client.lookupWord('yoga')

    const sources = results.map(r => r.source)
    expect(sources).toContain('PWG Dictionary')
    expect(sources).toContain('Buddhist Hybrid Sanskrit Grammar and Dictionary')
  })

  it('should handle API timeout gracefully', async () => {
    // Mock slow API
    const client = new CSaltDictionaryClient(apiEndpoint, ['PWG'], { timeout: 100 })

    await expect(client.lookupWord('yoga')).rejects.toThrow()
  })
})
```

**GREEN** (Implement):
- Create `CSaltDictionaryClient` class
- Implement HTTP calls to C-SALT API
- Parse API responses
- Handle timeouts/errors

**REFACTOR**:
- Extract API response parsing logic
- Add retry logic if needed
- Improve error messages

### TDD Cycle 3: Enhanced WordEntry Types

**Acceptance Criteria Covered**:
- "Enhanced WordEntry interface includes dictionaryDefinitions field"
- "Enhanced WordEntry interface includes contextualNote field"

**RED** (Write failing tests):
```typescript
// tests/unit/types.test.ts
describe('Enhanced WordEntry', () => {
  it('should accept dictionary definitions', () => {
    const entry: WordEntry = {
      word: 'yoga',
      meanings: ['yoga'],
      dictionaryDefinitions: [
        { source: 'PWG', definition: 'union...' }
      ]
    }

    expect(entry.dictionaryDefinitions).toHaveLength(1)
  })

  it('should accept contextual notes', () => {
    const entry: WordEntry = {
      word: 'yoga',
      meanings: ['yoga'],
      contextualNote: 'The subject of the sentence'
    }

    expect(entry.contextualNote).toBe('The subject of the sentence')
  })
})
```

**GREEN** (Implement):
- Update `WordEntry` interface in `src/domain/types.ts`
- Update `TranslationResult` to include `warnings`

**REFACTOR**:
- Add JSDoc documentation
- Ensure backward compatibility

### TDD Cycle 4: Enhanced LLM Prompts for Contextual Notes

**Acceptance Criteria Covered**:
- "LLM provides plain-English contextual notes for each word"
- "Contextual notes use plain English (no technical grammatical terms)"

**RED** (Write failing tests):
```typescript
// tests/unit/llm-client.test.ts
describe('LlmClient with contextual notes', () => {
  it('should return contextual notes for each word', async () => {
    const client = new MockLlmClient()
    const result = await client.translateSutra('yogaḥ')

    expect(result.words[0].contextualNote).toBeDefined()
    expect(result.words[0].contextualNote).not.toContain('nominative') // No technical terms
  })
})
```

**GREEN** (Implement):
- Update LLM prompt template to request contextual notes
- Update `MockLlmClient` to return contextual notes
- Validate prompt with real LLM (manual test)

**REFACTOR**:
- Refine prompt wording for clarity
- Ensure consistent plain-English output

### TDD Cycle 5: Compound Word Breakdown

**Acceptance Criteria Covered**:
- "LLM identifies and breaks down compound words into separate entries"
- "Compound words appear as multiple separate word entries (not nested)"

**RED** (Write failing tests):
```typescript
// tests/unit/llm-client.test.ts
describe('Compound word handling', () => {
  it('should break citta-vṛtti into two separate entries', async () => {
    const client = new MockLlmClient()
    const result = await client.translateSutra('citta-vṛtti-nirodhaḥ')

    const words = result.words.map(w => w.word)
    expect(words).toContain('citta')
    expect(words).toContain('vṛtti')
    expect(words).not.toContain('citta-vṛtti') // No compound in results
  })

  it('should explain compound relationship in contextual notes', async () => {
    const client = new MockLlmClient()
    const result = await client.translateSutra('citta-vṛtti')

    const cittaEntry = result.words.find(w => w.word === 'citta')
    expect(cittaEntry.contextualNote).toContain('combines with')
  })
})
```

**GREEN** (Implement):
- Update LLM prompt to break compounds into separate entries
- Update prompt to explain relationships in contextual notes
- Update mock data

**REFACTOR**:
- Ensure clear compound explanations
- Validate with multiple compound examples

### TDD Cycle 6: HybridTranslationService - Happy Path

**Acceptance Criteria Covered**:
- "Both dictionary definitions and LLM translations are shown for each word"
- "JSON output clearly distinguishes dictionary data from LLM data"

**RED** (Write failing tests):
```typescript
// tests/unit/hybrid-translation-service.test.ts
describe('HybridTranslationService', () => {
  it('should merge LLM and dictionary data', async () => {
    const llmClient = new MockLlmClient()
    const dictClient = new MockDictionaryClient()
    const service = new HybridTranslationService(llmClient, dictClient)

    const result = await service.translate('yogaḥ')

    expect(result.words[0].meanings).toEqual(['yoga']) // From LLM
    expect(result.words[0].dictionaryDefinitions).toBeDefined() // From dict
    expect(result.words[0].contextualNote).toBeDefined() // From LLM
  })
})
```

**GREEN** (Implement):
- Create `HybridTranslationService` class
- Implement `translate()` method with sequential execution:
  1. Call LLM first (await result)
  2. Extract word list from LLM response
  3. Call dictionary with word list (await result)
  4. Merge results
- Return enhanced TranslationResult

**Implementation Pattern**:
```typescript
async translate(sutra: string): Promise<TranslationResult> {
  // Step 1: Get LLM analysis (MUST happen first)
  const llmResponse = await this.llmClient.translateSutra(sutra)

  // Step 2: Extract words from LLM response
  const words = llmResponse.words.map(w => w.word)

  // Step 3: Look up words in dictionary (uses LLM's word list)
  const dictResults = await this.dictionaryClient.lookupWords(words)

  // Step 4: Merge
  const enhancedWords = llmResponse.words.map(llmWord => ({
    ...llmWord,
    dictionaryDefinitions: dictResults.get(llmWord.word) || []
  }))

  return {
    originalText: sutra,
    iastText: sutra,
    words: enhancedWords,
    alternativeTranslations: llmResponse.alternativeTranslations
  }
}
```

**REFACTOR**:
- Extract merging logic to helper function
- Add type safety
- Add error handling (covered in next cycles)

### TDD Cycle 7: Fallback - Dictionary API Unavailable

**Acceptance Criteria Covered**:
- "Fallback to LLM-only mode works when dictionary API is unavailable"
- "Appropriate warnings shown when services unavailable"

**RED** (Write failing tests):
```typescript
describe('HybridTranslationService - Dictionary Failure', () => {
  it('should fallback to LLM-only when dictionary fails', async () => {
    const llmClient = new MockLlmClient()
    const dictClient = new FailingDictionaryClient() // Always throws
    const service = new HybridTranslationService(llmClient, dictClient)

    const result = await service.translate('yogaḥ')

    expect(result.words[0].meanings).toBeDefined() // LLM still works
    expect(result.words[0].dictionaryDefinitions).toBeUndefined()
    expect(result.warnings).toContain('Dictionary API unavailable')
  })
})
```

**GREEN** (Implement):
- Add try-catch around dictionary calls
- Continue with LLM-only results on error
- Add warning to result

**REFACTOR**:
- Centralize error handling
- Add logging for monitoring

### TDD Cycle 8: Fallback - LLM Unavailable

**Acceptance Criteria Covered**:
- "Fallback to dictionary-only mode works when LLM is unavailable"

**RED** (Write failing tests):
```typescript
describe('HybridTranslationService - LLM Failure', () => {
  it('should fallback to dictionary-only when LLM fails', async () => {
    const llmClient = new FailingLlmClient() // Always throws
    const dictClient = new MockDictionaryClient()
    const service = new HybridTranslationService(llmClient, dictClient)

    const result = await service.translate('yogaḥ')

    expect(result.words[0].dictionaryDefinitions).toBeDefined()
    expect(result.words[0].meanings).toEqual([]) // Empty but defined
    expect(result.warnings).toContain('LLM unavailable')
  })
})
```

**GREEN** (Implement):
- Add try-catch around LLM calls
- Parse input to extract words for dictionary lookup
- Return dictionary-only results

**REFACTOR**:
- Improve word extraction logic
- Handle edge cases (empty input, etc.)

### TDD Cycle 9: Integration Tests

**Acceptance Criteria Covered**:
- All scenarios end-to-end

**RED** (Write failing tests):
```typescript
// tests/acceptance/hybrid-translation.test.ts
describe('Hybrid Translation - Full Flow', () => {
  it('should translate Yoga Sutra 1.2 with hybrid data', async () => {
    const service = createProductionService() // Real clients
    const result = await service.translate('yogaś citta-vṛtti-nirodhaḥ')

    expect(result.words).toHaveLength(4) // yogaḥ, citta, vṛtti, nirodhaḥ
    expect(result.words[0].dictionaryDefinitions).toBeDefined()
    expect(result.words[0].meanings).toBeDefined()
    expect(result.words[0].contextualNote).toBeDefined()
    expect(result.alternativeTranslations).toBeDefined()
  })
})
```

**GREEN** (Implement):
- Wire up real clients
- Test against real C-SALT API
- Validate full flow

**REFACTOR**:
- Optimize performance
- Add monitoring/logging

## Deployment Considerations

### Configuration Management

- Add C-SALT API credentials to environment configuration
- Document required environment variables
- Provide sensible defaults for development

### Monitoring

- Add logging for dictionary API calls (success/failure/latency)
- Track fallback scenarios (how often are services unavailable?)
- Monitor response times for performance tuning

### Rollout Strategy

1. **Phase 1**: Deploy with feature flag (optional)
   - Add `ENABLE_HYBRID_TRANSLATION=true` env var
   - Allow rollback to LLM-only if issues occur

2. **Phase 2**: Gradual rollout
   - Enable for internal testing first
   - Monitor errors and performance
   - Enable for all users once stable

3. **Phase 3**: Remove feature flag
   - Make hybrid translation the default
   - Remove old LLM-only code path (if desired)

## Success Metrics

- **Correctness**: Dictionary definitions match expected authoritative sources
- **Completeness**: All acceptance criteria tests pass
- **Performance**: Full translation completes within 15 seconds
- **Reliability**: Fallback mechanisms work 100% of the time
- **User Experience**: Contextual notes are clear and helpful (qualitative feedback)

## Timeline Estimate

- **TDD Cycle 1-2**: Dictionary client (2-3 hours)
- **TDD Cycle 3**: Type updates (30 minutes)
- **TDD Cycle 4-5**: LLM prompt enhancements (2-3 hours)
- **TDD Cycle 6-8**: HybridTranslationService (3-4 hours)
- **TDD Cycle 9**: Integration tests (1-2 hours)
- **Total**: ~10-15 hours of focused development

## Future Enhancements (Out of Scope)

These are explicitly NOT part of this feature:

- ❌ Caching dictionary responses
- ❌ Offline dictionary data
- ❌ Multiple LLM providers
- ❌ User-selectable dictionaries
- ❌ Dictionary definition ranking/filtering
- ❌ Performance optimizations beyond basic parallelization

These can be considered in future iterations if needed.
