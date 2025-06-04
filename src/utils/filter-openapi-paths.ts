import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { collectSchemaRefs } from './collect-schema-refs.js';
import { collectSchemas } from './collect-schemas.js';

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

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

  const collectedSchemas = collectSchemas(doc, schemaRefs);

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
