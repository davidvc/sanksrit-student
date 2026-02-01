# Acceptance Criteria: Devanagari OCR Image to Translation

**Feature:** Devanagari OCR Image to Translation
**Molecule:** sanskrit-student-mol-7vs
**Task:** sanskrit-student-mol-f4m
**Created:** 2026-01-27
**Status:** READY FOR REVIEW

## Overview

Enable users to upload images containing Devanagari text and receive:
1. Extracted Devanagari text (via OCR)
2. IAST transliteration
3. Word-by-word translation breakdown
4. Full translation

## Gherkin Feature File

Full scenarios documented in: `docs/features/devanagari-ocr-translation.feature`

## Acceptance Criteria Summary

### Happy Path Scenarios

✓ **AC1: Clear Devanagari Image Upload**
- User uploads image with clear Devanagari text
- System extracts text accurately
- System provides both Devanagari and IAST output
- System provides word-by-word breakdown
- System provides full translation

✓ **AC2: Manuscript Style Handling**
- System handles traditional manuscript-style Devanagari
- System correctly processes ligatures and conjunct characters
- OCR accuracy maintained for ornate scripts

✓ **AC3: Output Format Selection**
- User can request output in Devanagari format
- User can request output in IAST format
- Word-by-word translations use requested format for headwords

### Edge Cases

✓ **AC4: Mixed Script Images**
- System extracts only Devanagari portions
- Latin or other scripts are separated/ignored
- Translation focuses on Devanagari content

✓ **AC5: Multi-line Text**
- System preserves line breaks from image
- Each line translated separately
- Output maintains original structure

✓ **AC6: Sandhi (Word Joining)**
- System extracts sandhi combinations correctly
- System attempts sandhi splitting
- Word breakdown shows split components

✓ **AC7: Poor Quality Images**
- System attempts OCR with best effort
- Low confidence extractions flagged with warnings
- Confidence scores provided per word/character
- Translation attempted with low-confidence markers

### Error Conditions

✓ **AC8: No Devanagari Text**
- Error: "No Devanagari text detected"
- HTTP 422 (Unprocessable Entity)
- No translation attempted

✓ **AC9: Unsupported Format**
- Error: "Unsupported image format"
- Lists supported formats: PNG, JPG, JPEG, WEBP, TIFF
- HTTP 400 (Bad Request)

✓ **AC10: File Too Large**
- Maximum size: 10MB
- Error: "Image file too large"
- HTTP 413 (Payload Too Large)

✓ **AC11: Corrupted Image**
- Error: "Invalid or corrupted image file"
- HTTP 400 (Bad Request)

### Non-Functional Requirements

✓ **AC12: Performance**
- OCR extraction: ≤ 5 seconds
- Full translation: ≤ 10 seconds
- End-to-end: ≤ 15 seconds
- For standard images (1-2 MB, ~500 characters)

✓ **AC13: OCR Confidence Reporting**
- Response includes confidence scores
- Granularity: per-word or per-character
- Low confidence items flagged in output

## User-Facing Behavior Focus

These criteria focus on **what the user experiences**, not implementation details:
- Input: Image file
- Output: Extracted text + translation
- Errors: Clear, actionable messages
- Performance: Fast enough for interactive use

## Implementation Notes (Non-Prescriptive)

The following are suggestions, not requirements:

**OCR Engine Candidates:**
- Tesseract with Devanagari training data
- Google Cloud Vision API (excellent Devanagari support)
- Azure Computer Vision (supports Indic scripts)
- PaddleOCR (multi-language support)

**Integration Approach:**
- Add new endpoint: `POST /api/ocr/translate`
- Reuse existing translation logic from current system
- Add OCR adapter layer for engine swapping

**File Handling:**
- Support common formats: PNG, JPG, JPEG, WEBP, TIFF
- Maximum size: 10MB
- Consider pre-processing for quality enhancement

## Next Steps (After Review)

1. **Human Review Gate** - Await approval of these criteria
2. **Design Phase** - Create high-level architecture
3. **TDD Implementation** - Red-Green-Refactor cycles
4. **Submit** - Merge when complete

## Review Checklist

When reviewing these criteria, please verify:
- [ ] Are all scenarios complete?
- [ ] Is the language clear and unambiguous?
- [ ] Are edge cases adequately covered?
- [ ] Any missing scenarios?
- [ ] Are error conditions realistic and useful?
- [ ] Are performance targets reasonable?

---

**Ready for Human Review** ✓
