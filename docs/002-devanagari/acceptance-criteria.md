# Acceptance Criteria: Devanagari Script Input Support

## Feature: Accept Devanagari Script Input

As a Sanskrit student,
I want to submit Sanskrit sutras in Devanagari script,
So that I can use source texts in their original script without manual transliteration.

### Scenario: Translate a sutra provided in Devanagari script

```gherkin
Given I have a Sanskrit sutra in Devanagari script
When I submit the sutra for translation
Then I should receive the same word-by-word breakdown as IAST input
And each word should have one or more meanings provided
```

**Example:**
- Input: `अथ योगानुशासनम्`
- Expected: Same translation result as `atha yogānuśāsanam`

### Scenario: Handle Devanagari compound words and sandhi

```gherkin
Given I have a Sanskrit sutra in Devanagari containing compound words
When I submit the sutra for translation
Then compound words should be broken down into their component parts
And meanings for each component should be provided
```

**Example:**
- Input: `योगश्चित्तवृत्तिनिरोधः`
- Expected: Same translation result as `yogaś citta-vṛtti-nirodhaḥ`

---

## Feature: Devanagari Special Character Handling

As a Sanskrit student,
I want special Devanagari characters to be correctly converted,
So that the translation accurately reflects the original text.

### Scenario: Handle avagraha (elision marker)

```gherkin
Given I have a Sanskrit sutra containing avagraha (ऽ)
When I submit the sutra for translation
Then the avagraha should be converted to apostrophe in IAST
And the translation should be accurate
```

**Example:**
- Input: `तदा द्रष्टुः स्वरूपेऽवस्थानम्`
- Converts to: `tadā draṣṭuḥ svarūpe'vasthānam`

### Scenario: Handle anusvara (nasal mark)

```gherkin
Given I have a Sanskrit sutra containing anusvara (ं)
When I submit the sutra for translation
Then the anusvara should be converted to ṃ in IAST
And the translation should be accurate
```

**Example:**
- Input: `संयोग`
- Converts to: `saṃyoga`

### Scenario: Handle visarga (aspiration mark)

```gherkin
Given I have a Sanskrit sutra containing visarga (ः)
When I submit the sutra for translation
Then the visarga should be converted to ḥ in IAST
And the translation should be accurate
```

**Example:**
- Input: `द्रष्टुः`
- Converts to: `draṣṭuḥ`

### Scenario: Handle consonant conjuncts

```gherkin
Given I have a Sanskrit sutra containing consonant conjuncts
When I submit the sutra for translation
Then conjuncts should be correctly decomposed to their component consonants
And the translation should be accurate
```

**Examples:**
- Input: `वृत्ति` (vṛ conjunct) → Converts to: `vṛtti`
- Input: `द्र` (dr conjunct) → Converts to: `dra`
- Input: `क्ष` (kṣ conjunct) → Converts to: `kṣa`

### Scenario: Handle chandrabindu (nasalization)

```gherkin
Given I have a Sanskrit sutra containing chandrabindu (ँ)
When I submit the sutra for translation
Then the chandrabindu should be converted appropriately in IAST
And the translation should be accurate
```

---

## Feature: Mixed Input Format Detection

As a Sanskrit student,
I want the translator to automatically detect whether my input is in Devanagari or IAST,
So that I don't need to specify the input format manually.

### Scenario: Auto-detect Devanagari input

```gherkin
Given I submit text containing Devanagari characters
When the translator processes my input
Then it should automatically recognize the input as Devanagari
And process it accordingly without additional configuration
```

### Scenario: Auto-detect IAST input

```gherkin
Given I submit text containing only Latin characters with diacritics
When the translator processes my input
Then it should automatically recognize the input as IAST
And continue to process it as before
```

### Scenario: Reject mixed script input

```gherkin
Given I submit text containing both Devanagari and Latin characters
When the translator processes my input
Then it should return an error indicating mixed scripts are not supported
And suggest submitting in a single script format
```

### Scenario: Handle neutral characters in input

```gherkin
Given I submit text containing spaces, numerals, or punctuation
When the translator detects the script type
Then these neutral characters should not affect script detection
And the script should be determined by the actual script characters present
```

---

## Input/Output Specifications

### Input Formats

1. **Devanagari Script**
   - Unicode Devanagari block (U+0900 to U+097F)
   - Examples: `अथ योगानुशासनम्`, `योगश्चित्तवृत्तिनिरोधः`
   - Supports: vowel marks, consonant conjuncts, anusvara (ं), visarga (ः), avagraha (ऽ), chandrabindu (ँ)

2. **IAST Transliteration** (existing support)
   - Latin characters with diacritics
   - Examples: `atha yogānuśāsanam`, `yogaś citta-vṛtti-nirodhaḥ`

### Output Format
- Output remains unchanged (IAST transliteration with English meanings)
- The `originalText` field should preserve the input script as provided by the user

### CLI Usage
```bash
# Devanagari input
./translate "अथ योगानुशासनम्"

# IAST input (existing)
./translate "atha yogānuśāsanam"
```

### GraphQL Usage
```graphql
# Devanagari input
query {
  translateSutra(sutra: "अथ योगानुशासनम्") {
    originalText
    words { word meanings }
  }
}
```
