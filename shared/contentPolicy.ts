export const blockedTerms = [
  ["scheiße", "scheisse"],
  ["arschloch"],
  ["hurensohn"],
  ["wichser"],
  ["fotze"],
  ["fick"],
] as const;

const replacement = "[entfernt]";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termPatterns(variants: readonly string[]): RegExp[] {
  return variants.flatMap((variant) => {
    const escaped = escapeRegExp(variant);
    const direct = new RegExp(
      `(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
      "giu",
    );
    const splits = Array.from({ length: variant.length - 1 }, (_, index) => {
      const position = index + 1;
      const left = escapeRegExp(variant.slice(0, position));
      const right = escapeRegExp(variant.slice(position));

      return new RegExp(
        `(^|[^\\p{L}\\p{N}])${left}\\s+(?:und\\s+)?${right}(?=$|[^\\p{L}\\p{N}])`,
        "giu",
      );
    });

    return [direct, ...splits];
  });
}

const blockedPatterns = blockedTerms.flatMap(termPatterns);

export function sanitizeVisibleText(value: string): string {
  return blockedPatterns.reduce(
    (sanitized, pattern) =>
      sanitized.replace(pattern, (_match, prefix: string) => `${prefix}${replacement}`),
    value.normalize("NFC"),
  );
}
