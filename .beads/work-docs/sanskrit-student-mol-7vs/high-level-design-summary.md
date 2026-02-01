# High-Level Design Summary: Devanagari OCR to Translation

**Molecule:** sanskrit-student-mol-7vs
**Task:** sanskrit-student-mol-m1f
**Created:** 2026-01-27
**Status:** READY FOR REVIEW

## Quick Summary

Add image upload capability to the Sanskrit translation system. Users can photograph or scan Devanagari text, and the system will:
1. Extract text via OCR (Google Cloud Vision API)
2. Normalize script (existing Devanagari → IAST converter)
3. Translate (existing LLM-powered translation)

## Architecture Overview

```
Image Upload → OCR Extraction → Devanagari Text → Script Normalizer → Translation
                (NEW)                               (EXISTING)         (EXISTING)
```

**Key Decision:** OCR as pre-processing step, reusing 100% of existing translation pipeline.

## Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **OCR Engine** | Google Cloud Vision API | Best Devanagari accuracy out-of-box |
| **Architecture** | Port/Adapter pattern | Enables engine swapping, mockable for testing |
| **API** | GraphQL Mutation | Consistent with existing API, supports file upload |
| **File Handling** | graphql-upload | Standard GraphQL file upload solution |

## New Components

### 1. ImageStorageStrategy (Port Interface) 🆕

**Contract:** Store, retrieve, and cleanup uploaded images.

**Why:** Pluggable design allows future upgrades without changing business logic.

**Implementation Status:**
- ✅ `InMemoryImageStorage`: ONLY implementation - safe for ≤5MB files
- 🔮 `TempFileImageStorage`: Future (not implemented)
- 🔮 `CloudStorageStrategy`: Future (not implemented)

### 2. OcrEngine (Port Interface)
```typescript
interface OcrEngine {
  extractText(imageBuffer: Buffer, options?: OcrOptions): Promise<OcrResult>;
}
```

### 3. GoogleVisionOcrEngine (Adapter)
- Implements OcrEngine using Google Cloud Vision API
- Handles API communication, error handling, result mapping

### 4. OcrTranslationService (Orchestrator)
- Uses ImageStorageStrategy to handle upload
- Calls OCR engine with retrieved buffer
- Passes extracted text to existing translation service
- Augments result with OCR confidence and warnings
- **Always** cleans up stored image (via finally block)

### 5. ImageValidator
- Validates file format (PNG, JPG, JPEG, WEBP, TIFF)
- Validates file size (≤5MB initially, ≤10MB with temp storage)
- Checks magic bytes (security)

## GraphQL API Changes

```graphql
type Mutation {
  translateSutraFromImage(
    image: Upload!
    outputFormat: OutputFormat = IAST
  ): OcrTranslationResult!
}

type OcrTranslationResult {
  # Existing translation fields
  originalText: String!
  iastText: String!
  words: [WordEntry!]!
  alternativeTranslations: [String!]

  # New OCR metadata
  ocrConfidence: Float!
  ocrWarnings: [String!]
  extractedText: String!
}
```

## Confidence Score Handling

| Confidence | Threshold | Action |
|------------|-----------|--------|
| High | ≥ 90% | Proceed normally |
| Medium | 70-89% | Include warning |
| Low | < 70% | Flag heavily, suggest verification |

## Dependencies

**New:**
- `@google-cloud/vision` - Google Cloud Vision API
- `graphql-upload` - File upload support
- `file-type` - File format detection

**Existing (reused):**
- Script normalization (Devanagari → IAST)
- Translation service (LLM-powered)
- GraphQL server (graphql-yoga)

## File Structure

```
src/
├── domain/
│   ├── ocr-engine.ts               [NEW]
│   ├── image-storage-strategy.ts   [NEW]
│   ├── ocr-translation-service.ts  [NEW]
│   └── types.ts                    [EXTEND]
├── adapters/
│   ├── google-vision-ocr-engine.ts [NEW]
│   ├── in-memory-image-storage.ts  [NEW] ✅ ONLY STORAGE IMPLEMENTATION
│   ├── image-validator.ts          [NEW]
│   └── mock-ocr-engine.ts          [NEW]

Note: TempFileImageStorage NOT implemented - future upgrade only
```

## Key Risks & Mitigations

### Risk: OCR Accuracy with Manuscripts
**Mitigation:** Start with printed text, document limitations, future preprocessing

### Risk: API Costs
**Mitigation:** Rate limiting, caching, budget alerts, Tesseract fallback

### Risk: Large Images & Memory Pressure
**Mitigation:** 5MB limit (MVP), pluggable storage strategy, upgrade to temp files for 10MB later

### Risk: Security
**Mitigation:** MIME + magic byte validation, rate limiting, isolation

### Risk: Privacy & Data Retention
**Mitigation:** Ephemeral processing only, no image persistence, in-memory buffers, auto cleanup

## TDD Implementation Approach (RED-GREEN-REFACTOR)

### Critical Rule: TESTS FIRST

**For each acceptance criterion:**
1. **RED:** Write failing test FIRST
2. **GREEN:** Write minimal code to pass test
3. **REFACTOR:** Clean up code

**Never write production code without a failing test.**

### Phase 1: Setup (Not TDD)
1. Define port interfaces (OcrEngine, ImageStorageStrategy)
2. Create MockOcrEngine for testing
3. Create InMemoryImageStorage

### Phase 2: TDD Cycles (One Per Acceptance Criterion)

**14 Acceptance Criteria → 14 RED-GREEN-REFACTOR Cycles**

**Each cycle:**
1. **RED:** Write acceptance test → Verify FAILS
2. **GREEN:** Implement code → Verify PASSES
3. **REFACTOR:** Clean up → Verify STILL PASSES

**Example: AC1 - Clear Devanagari Image**
- RED: Write test with MockOcrEngine → FAILS
- GREEN: Implement OcrTranslationService → PASSES
- REFACTOR: Extract validation logic → STILL PASSES

### Phase 3: GraphQL Integration (TDD)
1. RED: Test mutation → FAILS
2. GREEN: Add mutation, wire up service → PASSES
3. REFACTOR: Extract validation → STILL PASSES

### Phase 4: Production OCR (TDD)
1. RED: Test GoogleVisionOcrEngine → FAILS
2. GREEN: Implement adapter → PASSES
3. REFACTOR: Clean up mapping → STILL PASSES

**Testing Philosophy:**
- ✅ 1-to-1 mapping: Each acceptance criterion = 1 test
- ✅ Acceptance tests with MockOcrEngine (fast, deterministic)
- ✅ Tests written BEFORE implementation
- ❌ No unit tests (acceptance coverage is sufficient)
- ❌ No end-to-end tests (manual testing with real API only)

## Relationship to Other Features

**Blocks:**
- Feature 2: IAST OCR support (same pipeline, different script)
- Feature 3: Multi-line sutra detection (builds on OCR base)

**Depends On:**
- ✓ Script detection (existing)
- ✓ Devanagari normalization (existing)
- ✓ Translation service (existing)

## Next Steps (After Review)

1. **Human Review Gate** - Approve this design
2. **TDD Implementation** - Red-Green-Refactor cycles per acceptance criterion
3. **Code Review** - Quality gate
4. **Submit** - Merge when complete

---

**Full Design Document:** `docs/features/003-ocr-translation/high-level-design.md`

**Review Checklist:**
- [ ] Does the approach make sense?
- [ ] Any architectural concerns?
- [ ] Simpler alternatives?
- [ ] Anything missing?
- [ ] Ready to proceed with implementation?
