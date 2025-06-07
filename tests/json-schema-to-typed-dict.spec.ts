import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { convertToTypedDict } from '../src/utils/json-schema-to-typed-dict';
import { extractSchemas } from '../src/utils/extract-schemas';
import child_process from 'child_process';

describe('generate-python-dict', () => {
  it('generates a simple object schema', () => {
    const doc: any = {
      openapi: '3.1.0',
      info: { title: 't', version: '1' },
      paths: {},
      components: { schemas: { User: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }
    };
    const schemas = extractSchemas(doc, null);
    const { definition, typingImports } = convertToTypedDict('User', schemas.User as any);
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
    const doc: any = {
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
    const { definition, typingImports } = convertToTypedDict('Wrapper', schemas.Wrapper as any);
    const typingLine = `from typing import ${Array.from(typingImports).join(', ')}`;
    const content = [typingLine, '', definition, ''].filter(Boolean).join('\n');
    const tmp = path.join(__dirname, 'tmp_wrapper.py');
    fs.writeFileSync(tmp, content);
    child_process.execSync(`python3 -m py_compile ${tmp}`);
    fs.unlinkSync(tmp);
    expect(content).toMatchSnapshot();
  });

  it('adds descriptions as comments', () => {
    const doc: any = {
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
    const { definition } = convertToTypedDict('User', schemas.User as any);
    expect(definition).toContain('"""User object\n\nAttributes:\n    id: identifier"""');
    expect(definition).not.toContain('# identifier');
  });

  it('filters schemas by path prefixes', () => {
    const doc: any = {
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
