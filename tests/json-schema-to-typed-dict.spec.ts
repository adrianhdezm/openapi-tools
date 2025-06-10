import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { convertToTypedDict } from '../src/utils/json-schema-to-typed-dict';
import { extractSchemas } from '../src/utils/extract-schemas';
import child_process from 'child_process';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

describe('generate-python-dict', () => {
  it('generates a simple object schema', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: { schemas: { User: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }
    };
    const schemas = extractSchemas(doc, null);
    const { definition, typingImports } = convertToTypedDict('User', schemas.User as OpenAPI.SchemaObject);
    const typingLine = `from typing import ${Array.from(typingImports).join(', ')}`;
    const content = [typingLine, '', definition, ''].filter(Boolean).join('\n');
    const tmp = path.join(__dirname, 'tmp_user.py');
    try {
      fs.writeFileSync(tmp, content);
      child_process.execSync(`python3 -m py_compile ${tmp}`);
    } finally {
      fs.unlinkSync(tmp);
    }
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
    const { definition, typingImports } = convertToTypedDict('Wrapper', schemas.Wrapper as OpenAPI.SchemaObject);
    const typingLine = `from typing import ${Array.from(typingImports).join(', ')}`;
    const content = [typingLine, '', definition, ''].filter(Boolean).join('\n');
    const tmp = path.join(__dirname, 'tmp_wrapper.py');
    fs.writeFileSync(tmp, content);
    child_process.execSync(`python3 -m py_compile ${tmp}`);
    fs.unlinkSync(tmp);
    expect(content).toMatchSnapshot();
  });

  it('adds descriptions as comments', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: {
        schemas: {
          User: {
            type: 'object',
            description: 'User object',
            properties: {
              id: { type: 'string', description: 'identifier' }
            },
            required: ['id']
          }
        }
      }
    };
    const schemas = extractSchemas(doc, null);
    const { definition } = convertToTypedDict('User', schemas.User as OpenAPI.SchemaObject);
    expect(definition).toMatchSnapshot();
  });

  it('handles allOf with refs and properties', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: {
        schemas: {
          Base: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
          Derived: {
            allOf: [
              { $ref: '#/components/schemas/Base' },
              { type: 'object', properties: { extra: { type: 'string' } }, required: ['extra'] }
            ]
          }
        }
      }
    };
    const schemas = extractSchemas(doc, null);
    const { definition, typingImports } = convertToTypedDict('Derived', schemas.Derived as OpenAPI.SchemaObject);
    const typingLine = `from typing import ${Array.from(typingImports).join(', ')}`;
    const content = [typingLine, '', definition, ''].filter(Boolean).join('\n');
    const tmp = path.join(__dirname, 'tmp_allof.py');
    fs.writeFileSync(tmp, content);
    child_process.execSync(`python3 -m py_compile ${tmp}`);
    fs.unlinkSync(tmp);
    expect(content).toMatchSnapshot();
  });

  it('handles oneOf with refs', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: {
        schemas: {
          A: { type: 'object', properties: { id: { type: 'string' } } },
          B: { type: 'object', properties: { value: { type: 'number' } } },
          Message: { oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }] }
        }
      }
    };
    const schemas = extractSchemas(doc, null);
    const { definition, typingImports } = convertToTypedDict('Message', schemas.Message as OpenAPI.SchemaObject);
    const typingLine = `from typing import ${Array.from(typingImports).join(', ')}`;
    const content = [typingLine, '', definition, ''].filter(Boolean).join('\n');
    const tmp = path.join(__dirname, 'tmp_oneof.py');
    fs.writeFileSync(tmp, content);
    child_process.execSync(`python3 -m py_compile ${tmp}`);
    fs.unlinkSync(tmp);
    expect(content).toMatchSnapshot();
  });

  it('handles inline object properties', () => {
    const doc: OpenAPI.Document = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: {
        schemas: {
          Place: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              location: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lon: { type: 'number' }
                },
                required: ['lat']
              }
            },
            required: ['name', 'location']
          }
        }
      }
    };
    const schemas = extractSchemas(doc, null);
    const { definition, typingImports } = convertToTypedDict('Place', schemas.Place as OpenAPI.SchemaObject);
    const typingLine = `from typing import ${Array.from(typingImports).join(', ')}`;
    const content = [typingLine, '', definition, ''].filter(Boolean).join('\n');
    const tmp = path.join(__dirname, 'tmp_inline.py');
    fs.writeFileSync(tmp, content);
    child_process.execSync(`python3 -m py_compile ${tmp}`);
    fs.unlinkSync(tmp);
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
