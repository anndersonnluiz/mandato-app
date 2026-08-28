const DERIVED_API_FIELDS = new Set(['daysRemaining']);
const GENERATED_ID_FIELDS = new Set(['id', 'decisionId']);

/**
 * Reduz estados local/API ao núcleo funcional comparável.
 * IDs são gerados por cada execução; daysRemaining é derivado da data.
 */
export function normalizeForParity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => normalizeForParity(item));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([field]) => !GENERATED_ID_FIELDS.has(field) && !DERIVED_API_FIELDS.has(field))
      .map(([field, nested]) => [field, normalizeForParity(nested)]),
  );
}
