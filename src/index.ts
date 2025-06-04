#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { Command } from 'commander';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { filterOpenApiPaths } from './utils/filter-paths.js';

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
  .requiredOption('--filter <filter>', 'Comma-separated list of path names, e.g., "/v1/chat/completions,/v1/models"')
  .action((opts) => {
    const { input, output, filter } = opts;
    const doc = yaml.load(fs.readFileSync(input, 'utf8')) as OpenAPI.Document;

    // Validate input OpenAPI document
    // ToDo: Add validation logic if needed

    // Parse filter: "/v1/chat/completions,/v1/models"
    const pathNames = filter
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean);

    const filtered = filterOpenApiPaths(doc, pathNames);

    fs.writeFileSync(output, yaml.dump(filtered), 'utf8');
    console.log(`Filtered OpenAPI spec written to ${output}`);
  });

program.parse(process.argv);
