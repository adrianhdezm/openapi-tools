import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { collectSchemaRefs } from './collect-schema-refs.js';

export function sortSchemas(schemas: Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject>): string[] {
  const deps: Record<string, Set<string>> = {};
  for (const [name, schema] of Object.entries(schemas)) {
    const refs = collectSchemaRefs(schema);
    deps[name] = new Set(Array.from(refs).filter((r) => r in schemas && r !== name));
  }

  const ordered: string[] = [];
  const temp = new Set<string>();
  const perm = new Set<string>();

  function visit(n: string) {
    if (perm.has(n)) return;
    if (temp.has(n)) return;
    temp.add(n);
    for (const dep of deps[n] ?? []) {
      visit(dep);
    }
    perm.add(n);
    temp.delete(n);
    ordered.push(n);
  }

  for (const name of Object.keys(schemas)) {
    visit(name);
  }

  return ordered;
}
