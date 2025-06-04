import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

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

export function filterOpenApiPaths(doc: OpenAPI.Document, pathNames: string[]): OpenAPI.Document {
  const filteredPaths: OpenAPI.PathsObject = {};
  for (const pathName of pathNames) {
    if (doc.paths && doc.paths[pathName]) {
      filteredPaths[pathName] = doc.paths[pathName];
    } else {
      console.warn(`\x1b[33m[openapi-tools] Warning:\x1b[0m Path "${pathName}" not found in the OpenAPI spec.`);
    }
  }

  // If no paths matched, return the original document
  if (Object.keys(filteredPaths).length === 0) {
    console.warn('\x1b[33m[openapi-tools] Warning:\x1b[0m No paths matched the filter criteria. Returning the original OpenAPI document.');
    return doc;
  }

  // Collect all schema refs from the filtered paths
  const schemaRefs = new Set<string>();
  for (const path of Object.values(filteredPaths)) {
    for (const method of Object.values(path ?? {})) {
      if (typeof method === 'object' && method !== null) {
        collectSchemaRefs(method, schemaRefs);
      }
    }
  }

  // Recursively collect referenced schemas
  const allSchemas = doc.components?.schemas ?? {};
  const collectedSchemas: Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject> = {};
  const toProcess = Array.from(schemaRefs);
  const processed = new Set<string>();

  while (toProcess.length > 0) {
    const schemaName = toProcess.pop()!;
    if (processed.has(schemaName)) continue;
    const schema = allSchemas[schemaName];
    if (schema) {
      collectedSchemas[schemaName] = schema;
      processed.add(schemaName);
      // Find nested $refs in this schema
      collectSchemaRefs(schema, schemaRefs);
      for (const ref of schemaRefs) {
        if (!processed.has(ref) && !toProcess.includes(ref)) {
          toProcess.push(ref);
        }
      }
    }
  }

  const filtered: OpenAPI.Document = {
    ...doc,
    paths: filteredPaths,
    components: {
      ...(doc.components || {}),
      schemas: collectedSchemas
    }
  };

  return filtered;
}
