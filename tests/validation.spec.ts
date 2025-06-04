import { describe, it, expect } from 'vitest';
import { isValidOpenapiSchema } from '../src/utils/validation';

describe('isValidOpenapiSchema', () => {
  it('returns true for a valid OpenAPI 3.1 document', async () => {
    const validDoc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {}
    };
    const result = await isValidOpenapiSchema(validDoc);
    expect(result).toBe(true);
  });

  it('returns false for a document missing openapi field', async () => {
    const invalidDoc = {
      info: { title: 'Test', version: '1.0.0' },
      paths: {}
    };
    const result = await isValidOpenapiSchema(invalidDoc);
    expect(result).toBe(false);
  });

  it('returns false for a document missing paths', async () => {
    const invalidDoc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' }
    };
    const result = await isValidOpenapiSchema(invalidDoc);
    expect(result).toBe(false);
  });

  it('returns false for a completely invalid object', async () => {
    const result = await isValidOpenapiSchema({ foo: 'bar' });
    expect(result).toBe(false);
  });

  it('returns false for a valid OpenAPI 3.0 document', async () => {
    const doc30 = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {}
    };
    const result = await isValidOpenapiSchema(doc30);
    expect(result).toBe(false);
  });

  it('returns false for a valid OpenAPI 2.0 (Swagger) document', async () => {
    const doc20 = {
      swagger: '2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {}
    };
    const result = await isValidOpenapiSchema(doc20);
    expect(result).toBe(false);
  });
});
