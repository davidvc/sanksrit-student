import * as fs from 'fs';
import * as path from 'path';

/**
 * Error thrown when a prompt file cannot be found.
 */
export class PromptNotFoundError extends Error {
  constructor(promptName: string) {
    super(`Prompt file not found: ${promptName}.txt`);
    this.name = 'PromptNotFoundError';
  }
}

/**
 * Loads prompt templates from configuration files and performs variable substitution.
 *
 * Prompts are stored as .txt files in a configurable directory. Variable placeholders
 * use the format {{variableName}} and are replaced at build time.
 */
export class PromptLoader {
  private readonly promptsDirectory: string;
  private readonly cache: Map<string, string> = new Map();

  /**
   * Creates a new PromptLoader.
   *
   * @param promptsDirectory - The directory containing prompt files
   */
  constructor(promptsDirectory: string) {
    this.promptsDirectory = promptsDirectory;
  }

  /**
   * Loads a prompt template from the prompts directory.
   *
   * @param promptName - The name of the prompt (without .txt extension)
   * @returns The raw prompt template content
   * @throws PromptNotFoundError if the prompt file does not exist
   */
  loadPrompt(promptName: string): string {
    const cached = this.cache.get(promptName);
    if (cached !== undefined) {
      return cached;
    }

    const filePath = path.join(this.promptsDirectory, `${promptName}.txt`);

    if (!fs.existsSync(filePath)) {
      throw new PromptNotFoundError(promptName);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    this.cache.set(promptName, content);

    return content;
  }

  /**
   * Substitutes variables in a template string.
   *
   * Variables are specified using {{variableName}} syntax. Unmatched
   * placeholders are left unchanged.
   *
   * @param template - The template string with variable placeholders
   * @param variables - Object mapping variable names to their values
   * @returns The template with variables substituted
   */
  substituteVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;

    for (const [name, value] of Object.entries(variables)) {
      const placeholder = `{{${name}}}`;
      result = result.replaceAll(placeholder, value);
    }

    return result;
  }

  /**
   * Loads a prompt and substitutes variables in one operation.
   *
   * This is a convenience method combining loadPrompt and substituteVariables.
   *
   * @param promptName - The name of the prompt (without .txt extension)
   * @param variables - Object mapping variable names to their values
   * @returns The fully substituted prompt
   * @throws PromptNotFoundError if the prompt file does not exist
   */
  buildPrompt(promptName: string, variables: Record<string, string>): string {
    const template = this.loadPrompt(promptName);
    return this.substituteVariables(template, variables);
  }
}
