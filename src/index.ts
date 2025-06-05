#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { Command } from 'commander';
import { filterOpenApiPaths } from './utils/filter-openapi-paths.js';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { isValidOpenapiSchema } from './utils/validation.js';
import { extractSchemas } from './utils/extract-schemas.js';
import { convertSchema } from './utils/json-schema-to-zod.js';
import { convertToTypedDict } from './utils/json-schema-to-typed-dict.js';
import Handlebars from 'handlebars';

// __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const pkgPath = path.resolve(__dirname, '../package.json');
const { version } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const program = new Command();

program.name('openapi-tools').description('OpenAPI Tools CLI').version(version);

program
  .command('filter')
  .description('Filter OpenAPI spec by comma-separated list of path names')
  .requiredOption('--input <input>', 'Input OpenAPI YAML file')
  .requiredOption('--output <output>', 'Output filtered YAML file')
  .requiredOption('-p, --select-paths <paths>', 'Comma-separated list of path names, e.g., "/v1/chat/completions,/v1/models"')
  .action(async (opts) => {
    const { input, output, selectPaths } = opts;
    const fileContent = yaml.load(fs.readFileSync(input, 'utf8'));

    // Parse select-paths: "/v1/chat/completions,/v1/models"
    const pathNames = selectPaths
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean);

    // Validate input OpenAPI document
    const isValidSchema = await isValidOpenapiSchema(fileContent);
    if (!isValidSchema) {
      console.error('Invalid OpenAPI schema. Please check the input file.');
      process.exit(1);
    }
    const doc = fileContent as OpenAPI.Document; // Here we are sure that the loaded content is an OpenAPI document

    const filtered = filterOpenApiPaths(doc, pathNames);

    fs.writeFileSync(output, yaml.dump(filtered), 'utf8');
    console.log(`Filtered OpenAPI spec written to ${output}`);
  });

program
  .command('generate-zod')
  .description('Generate Zod schemas from an OpenAPI spec')
  .requiredOption('--input <input>', 'Input OpenAPI file (YAML or JSON)')
  .requiredOption('--output <output>', 'Output directory for schemas')
  .option('-p, --select-paths <paths>', 'Comma-separated list of path prefixes')
  .action(async (opts) => {
    const { input, output, selectPaths } = opts;
    const raw = fs.readFileSync(input, 'utf8');
    const fileContent = input.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);

    const isValidSchema = await isValidOpenapiSchema(fileContent);
    if (!isValidSchema) {
      console.error('Invalid OpenAPI schema. Please check the input file.');
      process.exit(1);
    }
    const doc = fileContent as OpenAPI.Document;
    const prefixes = selectPaths
      ? selectPaths
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean)
      : null;

    const schemas = extractSchemas(doc, prefixes);
    if (Object.keys(schemas).length === 0) {
      console.warn('\x1b[33m[openapi-tools] Warning:\x1b[0m No schemas matched the filter.');
      return;
    }

    fs.mkdirSync(output, { recursive: true });
    const templateDir = path.resolve(__dirname, '../templates/zod');
    const schemaTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'zod-schema.hbs'), 'utf8'));
    const indexTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'index.hbs'), 'utf8'));

    const componentDir = path.join(output, 'components');
    fs.mkdirSync(componentDir, { recursive: true });

    const schemaNames: string[] = [];
    for (const [name, schema] of Object.entries(schemas)) {
      const { zodString, imports } = convertSchema(schema as any);
      const content = schemaTemplate({ schemaName: name, imports: Array.from(imports), zodString });
      fs.writeFileSync(path.join(componentDir, `${name}.ts`), content, 'utf8');
      schemaNames.push(name);
    }

    const indexContent = indexTemplate({ schemas: schemaNames });
    fs.writeFileSync(path.join(output, 'index.ts'), indexContent, 'utf8');
    console.log(`Generated Zod schemas written to ${output}`);
  });

program
  .command('generate-python-dict')
  .description('Generate Python TypedDicts from an OpenAPI spec')
  .requiredOption('--input <input>', 'Input OpenAPI file (YAML or JSON)')
  .requiredOption('--output <output>', 'Output directory for schemas')
  .option('-p, --select-paths <paths>', 'Comma-separated list of path prefixes')
  .action(async (opts) => {
    const { input, output, selectPaths } = opts;
    const raw = fs.readFileSync(input, 'utf8');
    const fileContent = input.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);

    const isValidSchema = await isValidOpenapiSchema(fileContent);
    if (!isValidSchema) {
      console.error('Invalid OpenAPI schema. Please check the input file.');
      process.exit(1);
    }
    const doc = fileContent as OpenAPI.Document;
    const prefixes = selectPaths
      ? selectPaths
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean)
      : null;

    const schemas = extractSchemas(doc, prefixes);
    if (Object.keys(schemas).length === 0) {
      console.warn('\x1b[33m[openapi-tools] Warning:\x1b[0m No schemas matched the filter.');
      return;
    }

    fs.mkdirSync(output, { recursive: true });
    const templateDir = path.resolve(__dirname, '../templates/python-dict');
    const indexTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'index.hbs'), 'utf8'));

    const componentDir = path.join(output, 'components');
    fs.mkdirSync(componentDir, { recursive: true });

    const schemaNames: string[] = [];
    for (const [name, schema] of Object.entries(schemas)) {
      const { definition, imports, typingImports } = convertToTypedDict(name, schema as any);
      const typingLine = `from typing import ${Array.from(typingImports).join(', ')}`;
      const importLines = Array.from(imports)
        .map((i) => `from .${i} import ${i}`)
        .join('\n');
      const content = [typingLine, importLines, '', definition, ''].filter(Boolean).join('\n');
      fs.writeFileSync(path.join(componentDir, `${name}.py`), content, 'utf8');
      schemaNames.push(name);
    }

    const indexContent = indexTemplate({ schemas: schemaNames });
    fs.writeFileSync(path.join(output, '__init__.py'), indexContent, 'utf8');
    console.log(`Generated Python TypedDicts written to ${output}`);
  });

program.parse(process.argv);
