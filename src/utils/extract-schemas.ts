import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { collectSchemaRefs } from './collect-schema-refs.js';
import { collectSchemas } from './collect-schemas.js';

export function extractSchemas(
  doc: OpenAPI.Document,
  prefixes: string[] | null
): Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject> {
  const allSchemas = doc.components?.schemas ?? {};
  if (!prefixes || prefixes.length === 0) {
    return allSchemas;
  }

  const refs = new Set<string>();
  for (const [pathName, pathItem] of Object.entries(doc.paths ?? {})) {
    if (prefixes.some((p) => pathName.startsWith(p))) {
      for (const method of Object.values(pathItem ?? {})) {
        if (typeof method === 'object' && method !== null) {
          collectSchemaRefs(method, refs);
        }
      }
    }
  }

  if (refs.size === 0) {
    return {};
  }

  return collectSchemas(doc, refs);
}
