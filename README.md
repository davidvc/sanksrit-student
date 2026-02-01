# Sanskrit Student

A Sanskrit translation tool that provides word-by-word breakdowns and multiple translation options. Translate text directly or upload images containing Devanagari script.

## Features

- Translate Sanskrit sutras (text or images)
- Word-by-word breakdown with meanings
- Multiple translation options
- Support for both Devanagari and IAST formats

## Installation

1. **Prerequisites**
   - Node.js 20.19.0 or higher
   - Anthropic API key (for Claude AI translations)
   - Google Cloud Vision API key (for OCR from images)

2. **Clone and install**

```bash
git clone git@github.com:davidvc/sanskrit-student.git
cd sanskrit-student
npm install
npm run build
```

3. **Configure API keys**

Create a `.env` file in the project root:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-cloud-credentials.json
```

**Getting API keys:**
- Anthropic API: https://console.anthropic.com/
- Google Cloud Vision: https://console.cloud.google.com/apis/credentials

## Usage

### Translate from Text (CLI)

```bash
# IAST transliteration
npm run translate "atha yoganusasanam"

# Devanagari script
npm run translate "अथ योगानुशासनम्"

# Using mock data (no API key needed)
npm run translate -- --mock "om"
```

**Example output:**

```json
{
  "originalText": "atha yoganusasanam",
  "iastText": "atha yogānuśāsanam",
  "words": [
    {
      "word": "atha",
      "meanings": ["now", "here begins", "auspicious beginning"]
    },
    {
      "word": "yogānuśāsanam",
      "meanings": ["instruction on yoga", "teaching of yoga"]
    }
  ],
  "alternativeTranslations": [
    "Now, the teaching of yoga",
    "Here begins the instruction on yoga"
  ]
}
```

### Translate from Image (GraphQL API)

1. **Start the server**

```bash
# Production (requires API keys)
node dist/server.js

# Testing with mock data
node dist/server.js --mock
```

Server runs at: `http://localhost:4000/graphql`

2. **Upload image via GraphQL**

**Using GraphQL Playground** (http://localhost:4000/graphql):

```graphql
mutation TranslateImage($image: Upload!) {
  translateSutraFromImage(image: $image) {
    originalText
    iastText
    extractedText
    ocrConfidence
    words {
      word
      meanings
    }
    alternativeTranslations
  }
}
```

Upload your image file in the variables section.

**Using cURL:**

```bash
curl http://localhost:4000/graphql \
  -F operations='{"query": "mutation($image: Upload!) { translateSutraFromImage(image: $image) { originalText iastText extractedText ocrConfidence } }", "variables": { "image": null }}' \
  -F map='{"0": ["variables.image"]}' \
  -F 0=@/path/to/sanskrit-image.png
```

**Image requirements:**
- Supported formats: PNG, JPG, JPEG, WEBP, TIFF
- Maximum size: 10 MB
- Must contain Devanagari text

### Translate Text via GraphQL

```graphql
query {
  translateSutra(sutra: "satyameva jayate") {
    originalText
    iastText
    words {
      word
      meanings
    }
    alternativeTranslations
  }
}
```

## Google Cloud Vision Setup

The tool currently uses a **mock OCR engine** for testing. To enable **real OCR** with Google Cloud Vision:

### 1. Enable Google Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Cloud Vision API**
4. Create a service account and download credentials JSON

### 2. Install Google Cloud Vision SDK

```bash
npm install @google-cloud/vision
```

### 3. Create Google Vision Adapter

Create `src/adapters/google-vision-ocr-engine.ts`:

```typescript
import vision from '@google-cloud/vision';
import { OcrEngine, OcrResult, OcrOptions } from '../domain/ocr-engine';

export class GoogleVisionOcrEngine implements OcrEngine {
  private client: vision.ImageAnnotatorClient;

  constructor() {
    this.client = new vision.ImageAnnotatorClient();
  }

  async extractText(imageBuffer: Buffer, options?: OcrOptions): Promise<OcrResult> {
    const [result] = await this.client.textDetection({
      image: { content: imageBuffer },
      imageContext: options?.languageHints
        ? { languageHints: options.languageHints }
        : undefined
    });

    const detections = result.textAnnotations || [];
    const text = detections[0]?.description || '';
    const confidence = detections[0]?.confidence || 0;

    return {
      text: text.trim(),
      confidence: confidence,
      language: detections[0]?.locale || 'unknown'
    };
  }
}
```

### 4. Update Server Configuration

Edit `src/server.ts` - replace `MockOcrEngine` with `GoogleVisionOcrEngine`:

```typescript
import { GoogleVisionOcrEngine } from './adapters/google-vision-ocr-engine';

export function createProductionConfig(): ServerConfig {
  const llmClient = new ClaudeLlmClient();
  const baseService = new LlmTranslationService(llmClient);
  const normalizer = createScriptNormalizer();
  const translationService = new NormalizingTranslationService(normalizer, baseService);

  // Add Google Vision OCR
  const googleOcrEngine = new GoogleVisionOcrEngine();
  const imageStorage = new InMemoryImageStorage();
  const ocrTranslationService = new OcrTranslationService(
    googleOcrEngine,
    imageStorage,
    translationService
  );

  return { translationService, ocrTranslationService };
}
```

### 5. Set Environment Variable

Add to `.env`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/google-credentials.json
```

### 6. Rebuild and Run

```bash
npm run build
node dist/server.js
```

Now image uploads will use Google Cloud Vision for real OCR!

## Troubleshooting

**"Missing API key" errors:**
- Check that `.env` file exists in project root
- Verify API keys are correct
- Use `--mock` flag for testing without API keys

**OCR not working:**
- Ensure Google Cloud Vision API is enabled
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Check that credentials JSON file has proper permissions
- Confirm image format is supported (PNG, JPG, WEBP, TIFF)

**Low OCR confidence:**
- Use clear, high-contrast images
- Ensure text is properly oriented
- Avoid noisy or low-quality scans

## License

[Add license information here]

## Acknowledgments

- Sanskrit transliteration: [@indic-transliteration/sanscript](https://github.com/sanskrit-coders/indic_transliteration_py)
- Translation: [Anthropic Claude](https://www.anthropic.com/)
- OCR: [Google Cloud Vision](https://cloud.google.com/vision)
