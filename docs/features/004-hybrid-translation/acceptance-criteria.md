# Acceptance Criteria: Hybrid Translation Approach Using Dictionary APIs and LLM

## Feature Summary

### Overview

The hybrid translation feature combines authoritative Sanskrit dictionary data from C-SALT APIs with contextual LLM analysis to provide students with both scholarly accuracy and practical understanding of Yoga Sutras.

### Key Benefits

**For Students:**
- **Authoritative Sources**: Dictionary definitions from respected scholarly sources (PWG Dictionary, Buddhist Hybrid Sanskrit Grammar and Dictionary, etc.)
- **Contextual Understanding**: LLM-provided translations and plain-English explanations of how words function in context
- **Clear Attribution**: Every piece of data is clearly labeled with its source (dictionary vs. LLM)
- **Beginner-Friendly**: No technical Sanskrit grammar terminology - all explanations in plain English

**For Learning:**
- See both what dictionaries say AND what the word means in this specific context
- Understand compound words through separate breakdowns of each component
- Compare multiple perspectives (dictionary definitions vs. LLM contextual translations)
- Trust the accuracy with dictionary citations while benefiting from LLM's contextual intelligence

### What This Feature Provides

1. **Enhanced Word Entries**:
   - LLM translation (what the word means in context)
   - Dictionary definitions (authoritative scholarly sources)
   - Plain-English contextual notes (how it functions in the sentence)

2. **Compound Word Breakdown**:
   - Automatically splits compound words into separate entries
   - Each component shown individually for easier understanding
   - Contextual notes explain how components combine

3. **Graceful Fallback**:
   - Works with LLM-only if dictionary API unavailable
   - Works with dictionary-only if LLM unavailable
   - Clear warnings when services are degraded

4. **Multiple Complete Translations**:
   - LLM provides 2-3 alternative translations of the full sutra
   - Shows different interpretive approaches

### Data Sources

- **C-SALT Dictionary APIs** (University of Cologne): Authoritative Sanskrit dictionaries
- **LLM**: Contextual translation and plain-English explanations

### JSON Output Structure

```json
{
  "words": [
    {
      "word": "yogaḥ",
      "meanings": ["yoga"],                    // LLM translation
      "dictionaryDefinitions": [...],          // Dictionary data
      "contextualNote": "The subject..."       // Plain English
    }
  ],
  "alternativeTranslations": [...]             // Complete translations
}
```

---

## Feature: Dictionary-Enhanced Word Definitions

As a Sanskrit student,
I want to see authoritative dictionary definitions for each word in a sutra,
So that I can trust the accuracy and scholarly basis of the translations I'm learning.

### Scenario: Display dictionary-sourced word definitions

```gherkin
Given I have a Sanskrit sutra in IAST transliteration
When I submit the sutra for hybrid translation
Then each word should include definitions from C-SALT dictionary APIs
And each definition should cite the source dictionary (e.g., "PWG Dictionary")
And the dictionary entry should include the Sanskrit root form
```

### Scenario: Multiple translation sources for comprehensive coverage

```gherkin
Given I have a Sanskrit sutra in IAST transliteration
When the system provides hybrid translation
Then multiple relevant dictionaries should be consulted (PWG, Buddhist Hybrid Sanskrit, etc.)
And the LLM should also provide its own translation for each word
And all available translations (dictionary and LLM) should be displayed
And each translation should be clearly attributed to its source (e.g., "PWG Dictionary", "LLM")
```

### Scenario: Handle words not found in dictionary

```gherkin
Given I have a Sanskrit word not present in the dictionary APIs
When the system attempts to look up the word
Then the system should gracefully indicate no dictionary entry was found
And the LLM should still provide contextual analysis
And the user should be informed which dictionaries were consulted
```

---

## Feature: LLM-Enhanced Contextual Explanation

As a Sanskrit student,
I want to understand what each word means in context and how it functions in the sentence,
So that I can see how words work together to create meaning.

### Scenario: Provide plain-English contextual explanation for each word

```gherkin
Given I have a Sanskrit sutra with words in various forms
When I submit the sutra for hybrid translation
Then each word should include a plain-English contextual note from the LLM
And the note should explain the word's role in the sentence
And the note should clarify which meaning applies in this context
And technical grammatical terms should be avoided
```

### Scenario: Break down compound words into separate entries

```gherkin
Given I have a Sanskrit sutra containing compound words (sandhi)
When the system analyzes the sutra
Then the LLM should identify compound boundaries
And each component should appear as a separate word entry in the results
And the contextual note should explain how the components combine
And the combined meaning should be clear from the individual parts
```

### Scenario: Provide LLM translation and contextual interpretation

```gherkin
Given I have a Sanskrit word with multiple possible dictionary meanings
When the LLM analyzes the word in context
Then the LLM should provide its own translation of the word
And the LLM should indicate which dictionary meaning aligns with its translation
And the reasoning for the contextual choice should be explained
And alternative interpretations should be mentioned if applicable
```

---

## Feature: Combined Hybrid Translation Output

As a Sanskrit student,
I want to see both authoritative dictionary definitions and contextual LLM analysis together,
So that I can benefit from both scholarly accuracy and contextual understanding.

### Scenario: Integrated word-by-word breakdown

```gherkin
Given I have a Sanskrit sutra in IAST transliteration
When I submit the sutra for hybrid translation
Then each word should display:
  | Component | Source |
  | Word in IAST | Original input |
  | LLM translation | LLM |
  | Dictionary definition(s) | Dictionary API with citation |
  | Contextual note | LLM (plain English explanation) |
And the presentation should clearly distinguish dictionary data from LLM data
And both dictionary definitions and LLM translations should be shown
And compound words should be broken into separate word entries
```

### Scenario: Full contextual translation with references

```gherkin
Given I have a Sanskrit sutra in IAST transliteration
When I receive the hybrid translation
Then I should see a complete translation of the sutra
And the translation should be based on the LLM's contextual understanding
And the word-by-word breakdown should reference dictionary sources
And the overall structure and grammar should be explained by the LLM
```

---

## Feature: Fallback and Error Handling

As a Sanskrit student,
I want the system to gracefully handle API failures and missing data,
So that I can still receive useful translations even when external services are unavailable.

### Scenario: Dictionary API unavailable

```gherkin
Given the C-SALT dictionary API is unavailable or times out
When I submit a sutra for hybrid translation
Then the system should fall back to LLM-only mode
And I should be notified that dictionary definitions are unavailable
And the translation should still complete successfully
And I should still receive grammatical analysis and contextual translation
```

### Scenario: Partial dictionary coverage

```gherkin
Given I have a sutra where some words are found in dictionaries and others are not
When the system provides hybrid translation
Then words with dictionary entries should show dictionary definitions
And words without dictionary entries should show LLM analysis only
And the presentation should clearly indicate which words have dictionary coverage
```

### Scenario: LLM service unavailable

```gherkin
Given the LLM service is unavailable or times out
When I submit a sutra for hybrid translation
Then the system should provide dictionary-only results if available
And I should be notified that contextual analysis is unavailable
And the user should see clear error messaging about degraded functionality
```

### Scenario: Both services unavailable

```gherkin
Given both dictionary API and LLM services are unavailable
When I submit a sutra for hybrid translation
Then the system should return a clear error message
And the error should indicate which services are unavailable
And the user should be advised to try again later
```

---

## Input/Output Specifications

### Input Format
- Sanskrit text in IAST (International Alphabet of Sanskrit Transliteration)
- Examples: `yogaś citta-vṛtti-nirodhaḥ`, `atha yogānuśāsanam`

### Output Format - Enhanced JSON Schema

The hybrid translation extends the existing `TranslationResult` interface with additional fields for dictionary data and grammatical analysis.

#### Enhanced WordEntry Interface

```typescript
interface DictionaryDefinition {
  /** Name of the dictionary source (e.g., "PWG Dictionary") */
  source: string;

  /** Definition text from the dictionary */
  definition: string;
}

interface WordEntry {
  /** The Sanskrit word in IAST transliteration */
  word: string;

  /** LLM-provided meanings/translations (existing field) */
  meanings: string[];

  /** NEW: Dictionary definitions from C-SALT APIs */
  dictionaryDefinitions?: DictionaryDefinition[];

  /** NEW: Plain-English contextual explanation from LLM */
  contextualNote?: string;
}
```

**Key simplifications for students:**
- **No `grammaticalAnalysis`** - technical terms like "nominative case" removed
- **No `compoundAnalysis`** - compounds just appear as multiple word entries
- **Simple `contextualNote`** - plain English like "the subject of the sentence" or "combines with next word to mean 'mind-fluctuations'"

#### Example JSON Output

```json
{
  "originalText": "yogaś citta-vṛtti-nirodhaḥ",
  "iastText": "yogaś citta-vṛtti-nirodhaḥ",
  "words": [
    {
      "word": "yogaḥ",
      "meanings": ["yoga"],
      "dictionaryDefinitions": [
        {
          "source": "PWG Dictionary",
          "definition": "union, joining, contact, method, application, use, means, way, manner, meditation, abstract contemplation"
        }
      ],
      "contextualNote": "The subject of the sentence - refers to the practice/discipline of yoga"
    },
    {
      "word": "citta",
      "meanings": ["mind", "consciousness"],
      "dictionaryDefinitions": [
        {
          "source": "PWG Dictionary",
          "definition": "thought, mind, heart, consciousness, attention, intelligence, reason"
        }
      ],
      "contextualNote": "Combines with the next word (vṛtti) to mean 'fluctuations of the mind'"
    },
    {
      "word": "vṛtti",
      "meanings": ["fluctuations", "modifications"],
      "dictionaryDefinitions": [
        {
          "source": "PWG Dictionary",
          "definition": "turning, rolling, moving about, activity, function, profession, conduct, behavior, manner of life"
        }
      ],
      "contextualNote": "Completes the compound word - together with citta means 'mind-fluctuations' or 'mental modifications'"
    },
    {
      "word": "nirodhaḥ",
      "meanings": ["cessation", "restraint"],
      "dictionaryDefinitions": [
        {
          "source": "PWG Dictionary",
          "definition": "confinement, locking up, imprisonment, restraint, check, suppression, destruction"
        }
      ],
      "contextualNote": "What yoga IS - 'cessation' is more accurate here than 'suppression'"
    }
  ],
  "alternativeTranslations": [
    "Yoga is the cessation of the fluctuations of the mind",
    "Yoga is the restraint of mental modifications",
    "Yoga is the stilling of the movements of consciousness"
  ]
}
```

**Note:** The compound word "citta-vṛtti" is broken into two separate entries (citta and vṛtti), making it easier for students to understand each component.

#### Data Source Transparency

- **`meanings` field**: LLM-provided translations
- **`dictionaryDefinitions` field**: Dictionary API data (always includes `source` attribution)
- **`contextualNote` field**: LLM-provided plain-English explanation
- **`alternativeTranslations` field**: LLM-provided complete translations

#### Degraded Mode Indicators

When services are unavailable, the response should include a `warnings` field:

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
    }
  ]
}
```

---

## Non-Functional Requirements

### Performance
- Dictionary API lookups should complete within 5 seconds per word
- Full hybrid translation should complete within 15 seconds for a typical sutra

### Reliability
- System should maintain 95% uptime for hybrid mode
- Fallback to LLM-only mode should be automatic and seamless
- Fallback to dictionary-only mode should work when LLM is unavailable

### Data Quality
- Dictionary citations must be accurate and verifiable
- LLM translations and analysis should be clearly distinguished from dictionary data
- Both dictionary definitions and LLM translations should be shown for each word
- When dictionary and LLM translations differ, both should be presented without preference

---

## Verification Checklist

- [ ] Dictionary API integration successfully retrieves word definitions
- [ ] Multiple dictionary sources are consulted (PWG, Buddhist Hybrid Sanskrit, etc.)
- [ ] LLM provides its own translation for each word (in `meanings` field)
- [ ] LLM provides plain-English contextual notes for each word
- [ ] LLM identifies and breaks down compound words into separate entries
- [ ] JSON output clearly distinguishes dictionary data from LLM data
- [ ] Both dictionary definitions and LLM translations are shown for each word
- [ ] Fallback to LLM-only mode works when dictionary API is unavailable
- [ ] Fallback to dictionary-only mode works when LLM is unavailable
- [ ] Appropriate warnings shown when services unavailable
- [ ] All dictionary definitions include source attribution
- [ ] Enhanced WordEntry interface includes dictionaryDefinitions field
- [ ] Enhanced WordEntry interface includes contextualNote field
- [ ] Compound words appear as multiple separate word entries (not nested)
- [ ] Contextual notes use plain English (no technical grammatical terms)
- [ ] Word-by-word breakdown integrates both dictionary and LLM data
- [ ] Full contextual translation is provided by LLM (alternativeTranslations)
- [ ] System handles words not found in dictionary gracefully
