import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { loadOpenapi } from '../src/utils/load-openapi';

const fileSpec = `openapi: 3.1.0
info:
  title: t
  version: 1.0.0
paths: {}
`;

const httpSpec = {
  openapi: '3.1.0',
  info: { title: 't', version: '1.0.0' },
  paths: {}
};

describe('loadOpenapi', () => {
  let tmpFile: string;
  let server: any;
  let url: string;

  beforeAll(async () => {
    tmpFile = path.join(process.cwd(), 'tmp-spec.yaml');
    fs.writeFileSync(tmpFile, fileSpec);

    server = createServer((_, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(httpSpec));
    }).listen(0);
    await new Promise((r) => server.on('listening', r));
    const address = server.address() as any;
    url = `http://localhost:${address.port}/spec.json`;
  });

  afterAll(() => {
    fs.unlinkSync(tmpFile);
    server.close();
  });

  it('loads a spec from a file path', async () => {
    const doc = await loadOpenapi(tmpFile);
    expect(doc).toEqual({
      openapi: '3.1.0',
      info: { title: 't', version: '1.0.0' },
      paths: {}
    });
  });

  it('loads a spec from an http url', async () => {
    const doc = await loadOpenapi(url);
    expect(doc).toEqual(httpSpec);
  });
});
