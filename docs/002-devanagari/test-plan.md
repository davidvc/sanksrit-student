# Test Plan: Devanagari Script Input Support

All tests are acceptance tests using the mocked LLM client. Tests execute GraphQL queries in-process against the schema, verifying end-to-end behavior without external dependencies.

## Test Structure

Tests are organized by acceptance criteria feature. Each test verifies the complete flow from input through script normalization to translation output.

---

## Feature: Accept Devanagari Script Input

### Test: Devanagari sutra produces same result as IAST equivalent

```typescript
// Input: अथ योगानुशासनम् (Devanagari)
// Expected: Same word breakdown as "atha yogānuśāsanam" (IAST)
// Verify: words array matches, originalText preserves Devanagari input
```

### Test: Devanagari compound words are handled correctly

```typescript
// Input: योगश्चित्तवृत्तिनिरोधः (Devanagari)
// Expected: Same result as "yogaś citta-vṛtti-nirodhaḥ" (IAST)
// Verify: compound word breakdown matches IAST input result
```

---

## Feature: Devanagari Special Character Handling

### Test: Avagraha converts to apostrophe

```typescript
// Input: तदा द्रष्टुः स्वरूपेऽवस्थानम्
// Expected: Normalizes to "tadā draṣṭuḥ svarūpe'vasthānam"
// Verify: Translation matches IAST equivalent
```

### Test: Anusvara converts correctly

```typescript
// Input: संयोग
// Expected: Normalizes to "saṃyoga"
// Verify: anusvara (ं) becomes ṃ
```

### Test: Visarga converts correctly

```typescript
// Input: द्रष्टुः
// Expected: Normalizes to "draṣṭuḥ"
// Verify: visarga (ः) becomes ḥ
```

### Test: Consonant conjuncts decompose correctly

```typescript
// Input: वृत्ति
// Expected: Normalizes to "vṛtti"
// Verify: conjunct characters properly separated

// Input: क्षेत्र
// Expected: Normalizes to "kṣetra"
// Verify: kṣ conjunct handled
```

### Test: Chandrabindu converts correctly

```typescript
// Input containing chandrabindu (ँ)
// Verify: appropriate IAST conversion
```

---

## Feature: Mixed Input Format Detection

### Test: Pure Devanagari input is detected and processed

```typescript
// Input: अथ योगानुशासनम्
// Expected: Detected as Devanagari, converted, translated successfully
// Verify: No errors, valid translation result
```

### Test: Pure IAST input continues to work

```typescript
// Input: atha yogānuśāsanam
// Expected: Detected as IAST, passed through unchanged
// Verify: Existing behavior preserved
```

### Test: Mixed script input returns error

```typescript
// Input: "अथ yoga" (Devanagari + Latin)
// Expected: Error response
// Verify: Error message indicates mixed scripts not supported
```

### Test: Neutral characters do not affect detection

```typescript
// Input: "अथ 123 योगानुशासनम्" (Devanagari with numbers and spaces)
// Expected: Detected as Devanagari
// Verify: Numbers, spaces, punctuation ignored in detection
```

---

## Mock Client Updates

The `MockLlmClient` needs additional entries for Devanagari test cases. Since Devanagari is normalized to IAST before reaching the LLM client, the mock's existing IAST lookup table should work. The mock's normalization function should be updated to handle both scripts.

### New mock entries needed:

| Devanagari Input | Normalized IAST | Notes |
|------------------|-----------------|-------|
| अथ योगानुशासनम् | atha yogānuśāsanam | YS 1.1 |
| योगश्चित्तवृत्तिनिरोधः | yogaś citta-vṛtti-nirodhaḥ | YS 1.2 |
| तदा द्रष्टुः स्वरूपेऽवस्थानम् | tadā draṣṭuḥ svarūpe'vasthānam | YS 1.3 |

---

## Test File Location

```
tests/
└── acceptance/
    ├── word-translation.test.ts      (existing IAST tests)
    ├── cli.test.ts                   (existing CLI tests)
    └── devanagari-input.test.ts      [NEW]
```
