#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { loadOpenapi } from './utils/load-openapi.js';
import { Command } from 'commander';
import { filterOpenApiPaths } from './utils/filter-openapi-paths.js';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { isValidOpenapiSchema } from './utils/validation.js';
import { extractSchemas } from './utils/extract-schemas.js';
import { convertSchema } from './utils/json-schema-to-zod.js';
import { convertToTypedDict } from './utils/json-schema-to-typed-dict.js';
import { sortSchemas } from './utils/sort-schemas.js';
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
  .requiredOption('--input <input>', 'Input OpenAPI (YAML or JSON) file or URL')
  .requiredOption('--output <output>', 'Output filtered YAML file')
  .requiredOption('-p, --select-paths <paths>', 'Comma-separated list of path names, e.g., "/v1/chat/completions,/v1/models"')
  .action(async (opts) => {
    const { input, output, selectPaths } = opts;
    const fileContent = await loadOpenapi(input);

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
  .requiredOption('--input <input>', 'Input OpenAPI file (YAML or JSON) or URL')
  .requiredOption('--output <output>', 'Output file for schemas')
  .option('-p, --select-paths <paths>', 'Comma-separated list of path prefixes')
  .action(async (opts) => {
    const { input, output, selectPaths } = opts;
    const fileContent = await loadOpenapi(input);

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

    const outFile = path.resolve(output);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });

    // Load and compile the Handlebars template
    const templatePath = path.resolve(__dirname, '../templates/ts/zod-schema.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    const ordered = sortSchemas(schemas);
    const schemaData = ordered.map((name) => {
      const schema = schemas[name]!;
      const { zodString } = convertSchema(schema);
      const desc = schema.description as string | undefined;
      return {
        schemaName: name,
        zodString,
        description: desc ? desc.replace(/\n/g, ' ') : undefined
      };
    });

    const content = template({ schemas: schemaData });
    fs.writeFileSync(outFile, content, 'utf8');
    console.log(`Generated Zod schemas written to ${outFile}`);
  });

program
  .command('generate-python-dict')
  .description('Generate Python TypedDicts from an OpenAPI spec')
  .requiredOption('--input <input>', 'Input OpenAPI file (YAML or JSON) or URL')
  .requiredOption('--output <output>', 'Output directory for schemas')
  .option('-p, --select-paths <paths>', 'Comma-separated list of path prefixes')
  .action(async (opts) => {
    const { input, output, selectPaths } = opts;
    const fileContent = await loadOpenapi(input);

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

    const outFile = path.resolve(output);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    const templatePath = path.resolve(__dirname, '../templates/python/python-dict-schema.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    const typingImports = new Set<string>();
    const ordered = sortSchemas(schemas);
    const definitions = ordered.map((name) => {
      const res = convertToTypedDict(name, schemas[name]!);
      res.typingImports.forEach((i) => typingImports.add(i));
      return { name, definition: res.definition };
    });

    const content = template({
      imports: Array.from(typingImports).join(', '),
      definitions
    });

    fs.writeFileSync(outFile, content, 'utf8');
    console.log(`Generated Python TypedDicts written to ${outFile}`);
  });

program.parse(process.argv);
