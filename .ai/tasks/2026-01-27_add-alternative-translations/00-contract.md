# Task Contract

**Task ID:** 2026-01-27_add-alternative-translations
**Beads Task:** sanskrit-student-zkg
**Created:** 2026-01-27
**Requestor:** User
**Assigned Role:** Orchestrator
**Workflow:** Feature

---

## Task Description

Add support for alternative translations (up to 3) for both complete sutras and individual words within sutras.

### Background and Context

Currently, the Sanskrit translation system provides a single translation for each word in a sutra. Sanskrit words often have multiple valid meanings depending on context, and providing alternatives helps students better understand the nuances and choose the most appropriate interpretation.

### Current State

The translation system returns:
- A single full sutra translation
- Word-by-word breakdown with one or more meanings per word (`meanings: string[]`)

The data model already supports multiple meanings per word through the `meanings` array in `WordEntry`, but:
1. No full sutra-level alternative translations
2. The LLM is not explicitly asked to provide alternatives

### Desired State

After this task:
- Each `TranslationResult` includes up to 3 alternative full sutra translations
- Each `WordEntry` provides up to 3 alternative meanings (leveraging existing `meanings[]` field)
- The GraphQL schema exposes these alternatives
- Tests validate the alternative translations feature

---

## Success Criteria

```
✓ GraphQL schema updated to include alternative sutra translations
✓ All existing tests passing
✓ New tests validate alternative translations (both sutra-level and word-level)
✓ Code coverage ≥ 80%
✓ LLM prompt updated to request alternatives
✓ Tester validation: APPROVED
✓ Reviewer validation: APPROVED
```

---

## Acceptance Criteria

### Functional Requirements
```
□ TranslationResult includes field for alternative sutra translations (up to 3)
□ WordEntry.meanings provides up to 3 alternative meanings
□ LLM prompt explicitly requests up to 3 alternatives
□ GraphQL query returns alternative translations
□ Mock data includes alternative translations for testing
```

### Quality Requirements
```
□ All tests passing
□ Code coverage 80-90%
□ No TypeScript errors
□ Code review approved by Reviewer role
□ Documentation updated (if needed)
```

### Non-Functional Requirements
```
□ Backward compatible with existing API
□ LLM response parsing handles varying numbers of alternatives (1-3)
□ Error handling for malformed LLM responses
□ Performance impact minimal (single LLM call)
```

---

## Constraints and Dependencies

### Constraints
```
□ Must use existing TranslationResult structure
□ Cannot break existing GraphQL API contracts
□ Must work with both mock and Claude LLM clients
□ Must maintain TDD approach
```

### Dependencies
```
□ Existing TypeScript codebase (src/domain/types.ts)
□ GraphQL Yoga server setup
□ Claude LLM client (for production)
□ Mock LLM client (for testing)
```

### Out of Scope
```
✗ UI for displaying alternatives (backend only)
✗ User preference for number of alternatives
✗ Translation quality ranking/scoring
✗ Alternative translations for Devanagari input normalization
```

---

## Estimated Complexity

**Complexity:** Small

**Rationale:**
- Number of files affected: ~6-8 files
  - types.ts (add field)
  - server.ts (update GraphQL schema)
  - llm-client.ts (update interface)
  - mock-llm-client.ts (update mock data)
  - claude-llm-client.ts (update prompt)
  - Tests (add new assertions)
- Lines of code estimate: ~100-150 LOC
- New concepts/patterns: No (extending existing patterns)
- Integration complexity: Low (leveraging existing structure)
- Risk level: Low (additive change, backward compatible)

---

## Lean Flow Analysis (MANDATORY)

### Batch Size Assessment

**Estimated Files:** 8 files

**Batch Size Evaluation:**
```
File Count Assessment:
├─ 1-5 files   → ✅ IDEAL: Small batch, proceed
├─ 6-14 files  → ⚠️ ACCEPTABLE: Document decomposition consideration
├─ 15-26 files → ❌ TOO LARGE: MUST decompose into 2-3 task packets
└─ 27+ files   → ❌ CRITICAL: MUST decompose into 3+ task packets

Your Task: 8 files → ⚠️ ACCEPTABLE
```

### Batch Size Justification

Files: 8 (within acceptable range but requires justification)

**Why not decomposed further:**
- High cohesion - all files tightly coupled (types → schema → implementation)
- Single concern - adding alternative translations is one logical unit
- Already minimal viable batch - cannot split types/schema/implementation

**Contingency for token limits:**
- If token limit hit, will decompose into:
  1. Phase 1: Update types + schema + tests (4 files)
  2. Phase 2: Update LLM clients + integration tests (4 files)

**Estimated tokens:** ~8 × 3000 = 24,000 tokens
**Status:** Within 25K-32K limit? YES (approaching but within)

### Token Budget Estimation

**Conservative Estimate:**
```
Files × Average Tokens Per File = Estimated Total
8 × 3,000 tokens = 24,000 tokens

Agent Output Limit: 25K-32K tokens

Status:
├─ <20K tokens → ✅ SAFE
├─ 20-25K tokens → ⚠️ APPROACHING LIMIT
├─ 25-42K tokens → ❌ HIGH RISK (40% failure probability)
└─ >42K tokens → ❌ GUARANTEED FAILURE

Your Task: 24,000 tokens → ⚠️ APPROACHING LIMIT
```

### Work In Progress (WIP) Planning

**Concurrent Execution Assessment:**
```
How many spawned agents will run simultaneously?

├─ 1 agent → ✅ IDEAL (complete before next)
├─ 2-3 agents → ⚠️ ACCEPTABLE (within limits)
└─ 4+ agents → ❌ EXCEEDS LIMIT (verification chaos)

Planned WIP: 1 agent (Engineer for implementation)
```

### Decomposition Decision

**Final Assessment:**

**Proceed as single task packet?**
- [X] YES - Batch size ≤14 files AND token budget ≤42K AND WIP ≤3

**Rationale:**
- 8 files is within acceptable range
- 24K tokens approaching limit but acceptable for single task
- Single Engineer agent for implementation
- High cohesion makes decomposition counterproductive

---

## Resources and References

### Relevant Files
```
- src/domain/types.ts - TranslationResult and WordEntry interfaces
- src/domain/translation-service.ts - Translation service interface
- src/domain/llm-client.ts - LLM client interface
- src/server.ts - GraphQL schema definition
- src/adapters/mock-llm-client.ts - Mock data for testing
- src/adapters/claude-llm-client.ts - Production LLM client
- tests/acceptance/word-translation.test.ts - Existing translation tests
- prompts/ - LLM prompt templates (if separate files)
```

### Documentation
```
- TypeScript type system (interfaces)
- GraphQL schema syntax
- Vitest testing framework
```

### Examples
```
- Existing WordEntry.meanings[] field shows multi-value pattern
- Existing test assertions show validation pattern
```

---

## Assumptions

```
1. Up to 3 alternatives is sufficient (not configurable)
2. LLM can reliably provide 1-3 alternatives per request
3. Existing meanings[] field in WordEntry is sufficient (no schema change needed for words)
4. GraphQL clients can handle optional/array fields for sutra alternatives
5. Backward compatibility means existing queries still work without requesting alternatives
```

*Note: If any assumption proves invalid, revisit this contract.*

---

## Risk Assessment

### Identified Risks
```
1. LLM may not always provide 3 alternatives
   - Probability: Medium
   - Impact: Low
   - Mitigation: Accept 1-3 alternatives, not strictly 3

2. Token budget approaching limit may cause incomplete output
   - Probability: Low
   - Impact: Medium
   - Mitigation: Monitor token usage, decompose if needed

3. Prompt engineering may require iteration
   - Probability: Medium
   - Impact: Low
   - Mitigation: Start with mock data, iterate prompt with real LLM
```

---

## Approvals and Sign-Off

**Contract Approved By:**
- [X] Requestor: User (2026-01-27)
- [X] Agent: Orchestrator (2026-01-27)

**Changes to Contract:**
None yet.

---

## Notes

The existing `WordEntry.meanings` field is already an array, which perfectly supports our requirement for multiple word meanings. The main work is:
1. Adding sutra-level alternative translations
2. Updating the LLM prompt to request alternatives
3. Ensuring tests validate the alternatives

This is a clean additive feature with low risk.

---

**Contract Version:** 1.0
**Last Updated:** 2026-01-27
