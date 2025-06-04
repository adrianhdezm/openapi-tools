import { type OpenAPIV3 } from 'openapi-types';

export function filterOpenApiPaths(doc: OpenAPIV3.Document, pathNames: string[]): OpenAPIV3.Document {
  const filteredPaths: OpenAPIV3.PathsObject = {};
  for (const pathName of pathNames) {
    if (doc.paths && doc.paths[pathName]) {
      filteredPaths[pathName] = doc.paths[pathName];
    } else {
      console.warn(`\x1b[33m[openapi-tools] Warning:\x1b[0m Path "${pathName}" not found in the OpenAPI spec.`);
    }
  }

  // If no paths matched, return the original document
  const filtered: OpenAPIV3.Document = Object.keys(filteredPaths).length === 0 ? doc : { ...doc, paths: filteredPaths };
  return filtered;
}
