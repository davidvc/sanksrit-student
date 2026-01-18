import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PromptLoader, PromptNotFoundError } from '../../src/adapters/prompt-loader';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Unit tests for PromptLoader.
 *
 * Tests prompt loading from configuration files with variable substitution.
 */
describe('PromptLoader', () => {
  const testPromptsDir = path.join(process.cwd(), 'test-prompts');

  beforeEach(() => {
    // Create test prompts directory
    fs.mkdirSync(testPromptsDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test prompts directory
    fs.rmSync(testPromptsDir, { recursive: true, force: true });
  });

  describe('loadPrompt', () => {
    it('should load a prompt from a text file', () => {
      const promptContent = 'Translate the following text: {{sutra}}';
      fs.writeFileSync(path.join(testPromptsDir, 'translate.txt'), promptContent);

      const loader = new PromptLoader(testPromptsDir);
      const result = loader.loadPrompt('translate');

      expect(result).toBe(promptContent);
    });

    it('should throw PromptNotFoundError when prompt file does not exist', () => {
      const loader = new PromptLoader(testPromptsDir);

      expect(() => loader.loadPrompt('nonexistent')).toThrow(PromptNotFoundError);
      expect(() => loader.loadPrompt('nonexistent')).toThrow(
        'Prompt file not found: nonexistent.txt'
      );
    });

    it('should cache loaded prompts', () => {
      const promptContent = 'Cached prompt: {{sutra}}';
      fs.writeFileSync(path.join(testPromptsDir, 'cached.txt'), promptContent);

      const loader = new PromptLoader(testPromptsDir);

      // Load twice
      const first = loader.loadPrompt('cached');
      const second = loader.loadPrompt('cached');

      expect(first).toBe(second);
    });
  });

  describe('substituteVariables', () => {
    it('should substitute a single variable', () => {
      const template = 'Sanskrit sutra: "{{sutra}}"';
      const loader = new PromptLoader(testPromptsDir);

      const result = loader.substituteVariables(template, { sutra: 'atha yoganuasanam' });

      expect(result).toBe('Sanskrit sutra: "atha yoganuasanam"');
    });

    it('should substitute multiple variables', () => {
      const template = 'Translate {{sutra}} to {{language}}';
      const loader = new PromptLoader(testPromptsDir);

      const result = loader.substituteVariables(template, {
        sutra: 'atha yoganuasanam',
        language: 'English',
      });

      expect(result).toBe('Translate atha yoganuasanam to English');
    });

    it('should substitute multiple occurrences of the same variable', () => {
      const template = '{{sutra}} - analyzing {{sutra}}';
      const loader = new PromptLoader(testPromptsDir);

      const result = loader.substituteVariables(template, { sutra: 'test' });

      expect(result).toBe('test - analyzing test');
    });

    it('should leave unmatched placeholders unchanged', () => {
      const template = 'Text: {{sutra}} and {{unknown}}';
      const loader = new PromptLoader(testPromptsDir);

      const result = loader.substituteVariables(template, { sutra: 'test' });

      expect(result).toBe('Text: test and {{unknown}}');
    });
  });

  describe('buildPrompt', () => {
    it('should load and substitute variables in one call', () => {
      const promptContent = 'Analyze this Sanskrit: "{{sutra}}"';
      fs.writeFileSync(path.join(testPromptsDir, 'analyze.txt'), promptContent);

      const loader = new PromptLoader(testPromptsDir);
      const result = loader.buildPrompt('analyze', { sutra: 'atha yoganuasanam' });

      expect(result).toBe('Analyze this Sanskrit: "atha yoganuasanam"');
    });
  });
});
