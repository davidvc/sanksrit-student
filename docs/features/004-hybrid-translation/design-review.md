# High-Level Design Review: Hybrid Translation

## Executive Summary

**Overall Assessment**: ✅ **APPROVED** with minor recommendations

The high-level design is comprehensive, well-structured, and follows TDD principles. It correctly identifies key components, data flows, risks, and provides a clear implementation plan. The design maintains the existing hexagonal architecture and ensures backward compatibility.

## Strengths

### 1. Architecture ✅
- **Clean separation of concerns** - Port/adapter pattern maintained
- **Backward compatible** - New `HybridTranslationService` implements existing `TranslationService` interface
- **Clear dependencies** - LLM and Dictionary clients are properly abstracted
- **No breaking changes** - GraphQL schema additions are all optional fields

### 2. Data Flow ✅
- **Parallel execution** - LLM and dictionary lookups happen concurrently (performance optimization)
- **Graceful degradation** - Clear fallback paths when services are unavailable
- **Comprehensive error handling** - Warnings field communicates degraded modes to users

### 3. TDD Implementation Plan ✅
- **Well-structured** - 9 cycles with clear RED-GREEN-REFACTOR steps
- **Acceptance criteria mapping** - Each cycle explicitly maps to AC checklist items
- **Progressive complexity** - Starts simple (interfaces/mocks) and builds up to integration
- **Testable design** - Mock implementations for both LLM and Dictionary clients

### 4. Risk Management ✅
- **Identified key risks** - API availability, rate limits, word form mismatches, compound complexity
- **Practical mitigations** - Each risk has concrete mitigation strategies
- **Realistic approach** - Acknowledges limitations (e.g., LLM compound analysis not 100% accurate)

## Recommendations for Improvement

### 1. Add C-SALT API Research Task to Preparation Phase

**Current**: Preparation phase mentions "Research C-SALT API documentation" but doesn't specify what to research.

**Recommendation**: Be more specific about what needs to be discovered:

```markdown
### Preparation Phase

**Before writing any tests:**
1. **Research C-SALT API**:
   - [ ] Determine if GraphQL or REST endpoint is better for our use case
   - [ ] Identify authentication requirements (API key, OAuth, etc.)
   - [ ] Document rate limits (requests per minute/hour/day)
   - [ ] Test lookups for inflected words (yogaḥ vs yoga) - do we need lemmatization?
   - [ ] Identify available dictionaries and their internal names/IDs
   - [ ] Check response format and error codes
   - [ ] Measure typical response times

2. **Test manual API calls**:
   - Try lookup for: yoga, yogaḥ, citta, vṛtti, nirodhaḥ
   - Document actual response structure
   - Test error scenarios (invalid word, timeout)

3. **Create API research document**: `docs/features/004-hybrid-translation/csalt-api-research.md`
```

**Why**: This provides a concrete checklist for the preparation phase and ensures critical unknowns are resolved before TDD begins.

---

### 2. Clarify Word Extraction Strategy for LLM Fallback

**Current**: "Parse input sutra to extract individual words (basic tokenization)" - too vague.

**Recommendation**: Specify the tokenization approach:

```markdown
### Fallback Path (LLM Down)

1. HybridTranslationService.translate() called
   ↓
2. Call LlmClient.translateSutra() → Timeout/Error
   ↓
3. Catch LLM error
   ↓
4. **Extract words using simple whitespace/hyphen splitting**:
   - Split on whitespace: "yogaś citta-vṛtti-nirodhaḥ" → ["yogaś", "citta-vṛtti-nirodhaḥ"]
   - Split compounds on hyphens: "citta-vṛtti-nirodhaḥ" → ["citta", "vṛtti", "nirodhaḥ"]
   - Note: This is a best-effort approach; without LLM, compound detection is limited
   ↓
5. Call DictionaryClient.lookupWords() → Success
   ↓
6. Return TranslationResult with:
   - words with only dictionaryDefinitions (no meanings or contextualNote)
   - warnings: ["LLM unavailable - showing dictionary-only definitions. Compound word analysis may be incomplete."]
```

**Why**: Implementation needs to know the exact tokenization strategy. The current design is ambiguous.

---

### 3. Add Performance Monitoring Considerations

**Current**: Monitoring section mentions logging but lacks specifics.

**Recommendation**: Add metrics to track:

```markdown
## Monitoring and Observability

### Metrics to Track

1. **Dictionary API Performance**:
   - Latency: p50, p95, p99 response times
   - Success rate: % of successful lookups
   - Timeout rate: % of requests exceeding 5s timeout
   - Batch size: average number of words per `lookupWords()` call

2. **Fallback Frequency**:
   - % of requests in hybrid mode (both services working)
   - % of requests in LLM-only mode (dictionary unavailable)
   - % of requests in dictionary-only mode (LLM unavailable)
   - % of complete failures (both services down)

3. **Data Quality**:
   - % of words with dictionary definitions found
   - % of words with LLM contextual notes
   - Average number of dictionary sources per word

4. **User Experience**:
   - End-to-end translation latency
   - % of requests completing within 15s SLA

### Logging Strategy

```typescript
// Example log structure
logger.info('Hybrid translation started', {
  sutra: input,
  wordCount: extractedWords.length
})

logger.info('Dictionary lookup completed', {
  duration: elapsed,
  wordsQueried: words.length,
  wordsFound: results.size,
  dictionaries: ['PWG', 'BHS']
})

logger.warn('Fallback to LLM-only', {
  reason: 'Dictionary API timeout',
  elapsed: 5200
})
```
```

**Why**: Provides concrete guidance for monitoring in production and helps diagnose issues.

---

### 4. Specify Dictionary Selection Strategy

**Current**: "Dictionaries to Query: PWG Sanskrit Dictionary (primary), Buddhist Hybrid Sanskrit Grammar and Dictionary, Vedic Index of Names and Subjects (optional)"

**Recommendation**: Be more explicit about which dictionaries to query and in what order:

```markdown
### Dictionary Selection Strategy

**Default Configuration**:
- Query all dictionaries in parallel for each word
- Return all results (don't filter by source)
- Let frontend/user see all perspectives

**Dictionaries to Query** (in priority order for display):
1. **PWG Sanskrit Dictionary** - Comprehensive, most entries (122,731)
2. **Buddhist Hybrid Sanskrit Grammar** - Specialized for Buddhist texts (17,807)
3. **Monier-Williams** - If available and different from PWG

**Environment Variable**:
```bash
CSALT_DICTIONARIES=PWG,BHS  # Comma-separated, will query all
```

**Future Enhancement** (not in scope):
- User preference for dictionary selection
- Context-aware dictionary prioritization (detect Buddhist vs Vedic texts)
```

**Why**: Removes ambiguity about which dictionaries to use and in what order to display results.

---

### 5. Add Data Validation Section

**Current**: No validation of LLM or dictionary responses mentioned.

**Recommendation**: Add validation requirements:

```markdown
## Data Validation

### LLM Response Validation

Before merging LLM data into the final result, validate:

```typescript
function validateLlmResponse(response: LlmTranslationResponse): void {
  // Must have at least one word
  if (!response.words || response.words.length === 0) {
    throw new ValidationError('LLM returned no words')
  }

  // Each word must have the required fields
  for (const word of response.words) {
    if (!word.word || word.word.trim() === '') {
      throw new ValidationError('Word entry missing word field')
    }
    if (!word.meanings || word.meanings.length === 0) {
      throw new ValidationError(`Word ${word.word} missing meanings`)
    }
  }

  // Contextual notes are optional but if present must be non-empty
  for (const word of response.words) {
    if (word.contextualNote !== undefined && word.contextualNote.trim() === '') {
      logger.warn('Empty contextual note', { word: word.word })
    }
  }
}
```

### Dictionary Response Validation

```typescript
function validateDictionaryResults(results: Map<string, DictionaryDefinition[]>): void {
  for (const [word, definitions] of results.entries()) {
    for (const def of definitions) {
      // Must have source
      if (!def.source || def.source.trim() === '') {
        logger.warn('Dictionary definition missing source', { word })
      }

      // Must have non-empty definition
      if (!def.definition || def.definition.trim() === '') {
        logger.warn('Empty dictionary definition', { word, source: def.source })
      }
    }
  }
}
```

**Why**: Ensures data quality and prevents malformed responses from breaking the UI.

---

### 6. Clarify Parallel vs Sequential Execution

**Current**: "Call LLM and dictionary in parallel" is mentioned but implementation details are unclear.

**Recommendation**: Show the exact pattern:

```typescript
### TDD Cycle 6: HybridTranslationService - Happy Path

**GREEN** (Implement):

```typescript
class HybridTranslationService implements TranslationService {
  async translate(sutra: string): Promise<TranslationResult> {
    // Step 1: Call LLM (must happen first to get word list)
    const llmResponse = await this.llmClient.translateSutra(sutra)

    // Step 2: Extract word list from LLM response
    const words = llmResponse.words.map(w => w.word)

    // Step 3: Call dictionary API in parallel with LLM already completed
    // (Not truly parallel since we need LLM's word list first)
    const dictionaryResults = await this.dictionaryClient.lookupWords(words)

    // Step 4: Merge results
    const enhancedWords = llmResponse.words.map(llmWord => ({
      ...llmWord,
      dictionaryDefinitions: dictionaryResults.get(llmWord.word) || []
    }))

    return {
      originalText: sutra,
      iastText: sutra,
      words: enhancedWords,
      alternativeTranslations: llmResponse.alternativeTranslations
    }
  }
}
```

**Note**: We can't truly parallelize because we need the LLM's word breakdown to know which words to look up in the dictionary. The LLM must go first.

**Alternative Optimization** (optional future enhancement):
```typescript
// Could parallelize by doing naive word extraction + LLM in parallel,
// then merge LLM's better word breakdown with dictionary results.
// Not recommended for initial implementation - adds complexity.
```
```

**Why**: The current design says "parallel" but actually LLM must go first to know what words to look up. This clarifies the actual execution order.

---

### 7. Add Example Error Responses

**Current**: Error handling described but no example responses shown.

**Recommendation**: Add concrete examples:

```markdown
## Error Response Examples

### Dictionary API Timeout

```json
{
  "originalText": "yogaś citta-vṛtti-nirodhaḥ",
  "iastText": "yogaś citta-vṛtti-nirodhaḥ",
  "warnings": [
    "Dictionary API unavailable - showing LLM-only translations"
  ],
  "words": [
    {
      "word": "yogaḥ",
      "meanings": ["yoga"],
      "contextualNote": "The subject of the sentence"
      // Note: dictionaryDefinitions is absent
    }
  ],
  "alternativeTranslations": [
    "Yoga is the cessation of the fluctuations of the mind"
  ]
}
```

### LLM Timeout

```json
{
  "originalText": "yogaś citta-vṛtti-nirodhaḥ",
  "iastText": "yogaś citta-vṛtti-nirodhaḥ",
  "warnings": [
    "LLM unavailable - showing dictionary-only definitions. Compound word analysis may be incomplete."
  ],
  "words": [
    {
      "word": "yogaś",
      "meanings": [],  // Empty array since LLM unavailable
      "dictionaryDefinitions": [
        {
          "source": "PWG Dictionary",
          "definition": "union, joining, contact..."
        }
      ]
      // Note: contextualNote is absent
    },
    {
      "word": "citta-vṛtti-nirodhaḥ",
      "meanings": [],
      "dictionaryDefinitions": []  // No match for compound form
    }
  ]
}
```

### Both Services Down

```json
{
  "error": {
    "message": "Translation services unavailable",
    "details": "Both LLM and Dictionary API are currently unavailable. Please try again later.",
    "code": "SERVICE_UNAVAILABLE"
  }
}
```
```

**Why**: Concrete examples help implementers understand the expected error response structure.

---

## Minor Clarifications

### 1. TypeScript Interface Consistency

The design shows `DictionaryDefinition` defined in multiple places. Ensure it's defined once in `types.ts`:

```typescript
// src/domain/types.ts
export interface DictionaryDefinition {
  source: string
  definition: string
}
```

### 2. Configuration Defaults

Add recommended defaults for environment variables:

```bash
# Development defaults
CSALT_API_ENDPOINT=https://api.c-salt.uni-koeln.de/
CSALT_DICTIONARIES=PWG,BHS
CSALT_TIMEOUT_MS=5000
ENABLE_HYBRID_TRANSLATION=true  # Feature flag
```

### 3. Testing Strategy Note

Add note about integration testing requirements:

```markdown
### TDD Cycle 9: Integration Tests

**Important**: Integration tests require:
- Access to C-SALT API (may need VPN or whitelist)
- Real LLM API key
- Network connectivity
- Longer timeouts (15+ seconds)

**CI/CD Considerations**:
- Mark integration tests as `@integration` for selective running
- Use mocks in CI, real APIs in staging/manual testing
- Add retry logic for flaky network issues
```

---

## Questions for Clarification

1. **Dictionary Lemmatization**: If C-SALT doesn't accept inflected forms (yogaḥ), do we:
   - Try naive de-inflection (remove ḥ, m, etc.)?
   - Rely on LLM to provide lemma in contextual note?
   - Accept that some words won't have dictionary matches?

2. **Multiple Dictionary Results**: If PWG and BHS both have entries for "yoga", do we:
   - Show both separately?
   - Merge into one definition with multiple sources?
   - Let frontend decide how to display?

3. **Compound Word Tokenization**: When LLM breaks "citta-vṛtti" into separate entries, should dictionary lookup try:
   - Both "citta-vṛtti" (compound) AND "citta" + "vṛtti" (components)?
   - Only components (as designed)?

4. **Performance SLA**: 15 seconds for full sutra - is this acceptable for production?
   - Consider showing progressive updates (LLM first, dictionary adds later)?
   - Or strict 15s with timeout?

---

## Conclusion

**Design Status**: ✅ **APPROVED FOR IMPLEMENTATION**

**Strengths**:
- Solid architecture maintaining hexagonal principles
- Comprehensive TDD plan with clear acceptance criteria mapping
- Thoughtful risk mitigation strategies
- Backward compatible design

**Recommended Improvements**:
1. Add detailed C-SALT API research checklist ⭐ (Critical)
2. Clarify word extraction for LLM fallback ⭐ (Critical)
3. Add performance monitoring metrics (Nice-to-have)
4. Specify dictionary selection strategy (Nice-to-have)
5. Add data validation section ⭐ (Critical)
6. Clarify execution order (LLM → Dictionary, not parallel) ⭐ (Critical)
7. Add error response examples (Nice-to-have)

**Critical items (⭐)** should be addressed before implementation begins.

**Nice-to-have items** can be documented during implementation or added to the design doc for reference.

---

**Reviewer**: Claude (Orchestrator)
**Date**: 2026-01-28
**Status**: APPROVED WITH RECOMMENDATIONS
