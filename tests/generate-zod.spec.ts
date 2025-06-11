import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import ts from 'typescript';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { convertSchema } from '../src/utils/json-schema-to-zod';
import { extractSchemas } from '../src/utils/extract-schemas';

const templateDir = path.resolve('templates/ts');
const schemaTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'zod-schema.hbs'), 'utf8'));

describe('generate-zod', () => {
  it('generates a simple object schema', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: { schemas: { User: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }
    };
    const schemas = extractSchemas(doc, null);
    const { zodString } = convertSchema(schemas.User as OpenAPI.SchemaObject);
    const content = schemaTemplate({
      schemas: [{ schemaName: 'userSchema', zodString }]
    });
    const result = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.ESNext } });
    expect(result.diagnostics?.length).toBe(0);
    expect(content).toMatchSnapshot();
  });

  it('generates enums and nested arrays', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: {
        schemas: {
          Status: { type: 'string', enum: ['on', 'off'] },
          Wrapper: { type: 'array', items: { $ref: '#/components/schemas/Status' } }
        }
      }
    };
    const schemas = extractSchemas(doc, null);
    const { zodString } = convertSchema(schemas.Wrapper as OpenAPI.SchemaObject);
    const content = schemaTemplate({
      schemas: [{ schemaName: 'wrapperSchema', zodString }]
    });
    const result = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.ESNext } });
    expect(result.diagnostics?.length).toBe(0);
    expect(content).toMatchSnapshot();
  });

  it('filters schemas by path prefixes', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {
        '/users/list': {
          get: {
            responses: { '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } }
          }
        },
        '/admin/data': {
          get: {
            responses: { '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Admin' } } } } }
          }
        }
      },
      components: {
        schemas: {
          User: { type: 'object', properties: { id: { type: 'string' } } },
          Admin: { type: 'object', properties: { secret: { type: 'string' } } }
        }
      }
    };
    const schemas = extractSchemas(doc, ['/users']);
    expect(Object.keys(schemas)).toEqual(['User']);
  });
});
