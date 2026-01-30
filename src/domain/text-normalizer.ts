/**
 * Utilities for normalizing text into consistent array format.
 *
 * This module provides functions to convert multi-line strings into
 * arrays, ensuring consistent handling across the application.
 */

/**
 * Normalizes a string (single or multi-line) into an array of non-empty lines.
 *
 * This function:
 * - Splits on newline characters
 * - Filters out empty lines (after trimming)
 * - Always returns an array, even for single-line input
 *
 * @param text - The input text to normalize
 * @returns Array of non-empty lines
 *
 * @example
 * normalizeToLines("hello") // ["hello"]
 * normalizeToLines("hello\nworld") // ["hello", "world"]
 * normalizeToLines("hello\n\nworld") // ["hello", "world"]
 */
export function normalizeToLines(text: string): string[] {
  return text.split('\n').filter(line => line.trim().length > 0);
}
