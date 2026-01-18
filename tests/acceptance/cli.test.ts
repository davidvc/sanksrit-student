import { describe, it, expect } from 'vitest';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import { TranslationResult, WordEntry } from '../../src/domain/types';

/**
 * Options for executing CLI commands in tests.
 */
const EXEC_OPTIONS: ExecSyncOptionsWithStringEncoding = {
  encoding: 'utf-8',
  cwd: process.cwd(),
};

/**
 * Executes the CLI with the given arguments.
 *
 * @param args - Command line arguments to pass to the CLI
 * @returns The stdout output from the CLI
 * @throws Error if CLI exits with non-zero status
 */
function runCli(args: string): string {
  return execSync(`npm run translate -- ${args}`, EXEC_OPTIONS);
}

/**
 * Executes the CLI and captures both stdout and exit status.
 *
 * @param args - Command line arguments to pass to the CLI
 * @returns Object with stdout, stderr, and success status
 */
function runCliSafe(args: string): { stdout: string; stderr: string; success: boolean } {
  try {
    const stdout = execSync(`npm run translate -- ${args}`, {
      ...EXEC_OPTIONS,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', success: true };
  } catch (error: unknown) {
    const execError = error as { stdout?: Buffer; stderr?: Buffer };
    return {
      stdout: execError.stdout?.toString() ?? '',
      stderr: execError.stderr?.toString() ?? '',
      success: false,
    };
  }
}

/**
 * Type guard to check if a value matches the WordEntry interface.
 */
function isWordEntry(value: unknown): value is WordEntry {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.word === 'string' &&
    typeof obj.grammaticalForm === 'string' &&
    Array.isArray(obj.meanings) &&
    obj.meanings.every((m: unknown) => typeof m === 'string')
  );
}

/**
 * Type guard to check if a value matches the TranslationResult interface.
 */
function isTranslationResult(value: unknown): value is TranslationResult {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.originalText === 'string' &&
    Array.isArray(obj.words) &&
    obj.words.every(isWordEntry)
  );
}

/**
 * Acceptance tests for the CLI interface.
 *
 * These tests verify that the CLI:
 * - Returns valid JSON output when given a sutra with --mock flag
 * - Shows an error when no sutra argument is provided
 * - Produces output that matches the TranslationResult type structure
 */
describe('CLI acceptance tests', () => {
  describe('Basic invocation with --mock flag', () => {
    it('should return valid JSON output', () => {
      const output = runCli('--mock "atha yoganuasanam"');

      // Extract JSON from npm output (skip npm run lines)
      const lines = output.trim().split('\n');
      const jsonLine = lines.find(line => line.startsWith('{'));
      expect(jsonLine).toBeDefined();

      // Should parse as valid JSON
      const result = JSON.parse(jsonLine!);
      expect(result).toBeDefined();
    });
  });

  describe('Missing sutra argument', () => {
    it('should show error when no sutra is provided', () => {
      const { stderr, success } = runCliSafe('--mock');

      expect(success).toBe(false);
      expect(stderr.toLowerCase()).toMatch(/sutra|argument|required|missing/i);
    });
  });

  describe('Output structure validation', () => {
    it('should return JSON matching TranslationResult type', () => {
      const output = runCli('--mock "atha yoganuasanam"');

      // Extract JSON from npm output
      const lines = output.trim().split('\n');
      const jsonLine = lines.find(line => line.startsWith('{'));
      expect(jsonLine).toBeDefined();

      const result = JSON.parse(jsonLine!);

      // Verify structure matches TranslationResult
      expect(isTranslationResult(result)).toBe(true);

      // Verify specific field expectations
      expect(result.originalText).toBe('atha yoganuasanam');
      expect(result.words.length).toBeGreaterThan(0);

      // Each word should have required fields
      for (const word of result.words) {
        expect(word.word).toBeDefined();
        expect(word.word.length).toBeGreaterThan(0);
        expect(word.grammaticalForm).toBeDefined();
        expect(word.grammaticalForm.length).toBeGreaterThan(0);
        expect(word.meanings).toBeInstanceOf(Array);
        expect(word.meanings.length).toBeGreaterThan(0);
      }
    });
  });
});
