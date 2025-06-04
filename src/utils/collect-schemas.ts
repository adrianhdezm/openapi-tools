import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { collectSchemaRefs } from './collect-schema-refs.js';

export function collectSchemas(doc: OpenAPI.Document, refs: Set<string>): Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject> {
  const allSchemas = doc.components?.schemas ?? {};
  const collected: Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject> = {};
  const queue = Array.from(refs);
  const processed = new Set<string>();

  while (queue.length > 0) {
    const name = queue.pop()!;
    if (processed.has(name)) continue;
    const schema = allSchemas[name];
    if (schema) {
      collected[name] = schema;
      processed.add(name);
      collectSchemaRefs(schema, refs);
      for (const ref of refs) {
        if (!processed.has(ref) && !queue.includes(ref)) {
          queue.push(ref);
        }
      }
    }
  }

  return collected;
}
