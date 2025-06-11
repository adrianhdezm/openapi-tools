import { describe, it, expect } from 'vitest';
import { toPascalCase, toCamelCase } from '../src/utils/case';

describe('case utils', () => {
  it('converts to PascalCase', () => {
    expect(toPascalCase('my_schema-name')).toBe('MySchemaName');
  });
  it('converts to camelCase', () => {
    expect(toCamelCase('my_schema-name')).toBe('mySchemaName');
  });
});
