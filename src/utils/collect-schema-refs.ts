export function collectSchemaRefs(obj: unknown, refs: Set<string> = new Set()): Set<string> {
  if (!obj || typeof obj !== 'object') {
    return refs;
  }
  if ('$ref' in (obj as Record<string, unknown>) && typeof (obj as Record<string, unknown>)['$ref'] === 'string') {
    const ref = (obj as Record<string, unknown>)['$ref'] as string;
    const match = ref.match(/^#\/components\/schemas\/([^/]+)$/);
    if (match && match[1]) {
      refs.add(match[1]);
    }
  }
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && (obj as Record<string, unknown>)[key]) {
      collectSchemaRefs((obj as Record<string, unknown>)[key], refs);
    }
  }
  return refs;
}
