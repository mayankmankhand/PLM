// Shared formatting utilities.

/**
 * Converts a PascalCase or camelCase string into spaced words.
 * e.g. "ProductRequirement" -> "Product Requirement"
 */
export function humanize(str: string): string {
  return str.replace(/([A-Z])/g, " $1").trim();
}
