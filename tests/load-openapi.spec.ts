import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadOpenapi } from '../src/utils/load-openapi';

const fileSpec = `openapi: 3.1.0
info:
  title: t
  version: 1.0.0
paths: {}
`;

const parsedSpec = {
  openapi: '3.1.0',
  info: { title: 't', version: '1.0.0' },
  paths: {}
};

describe('loadOpenapi', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads a spec from a file path', async () => {
    vi.mock('fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue(fileSpec)
    }));
    const doc = await loadOpenapi('spec.yaml');
    expect(doc).toEqual(parsedSpec);
  });

  it('loads a spec from an http url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(JSON.stringify(parsedSpec))
    });
    vi.stubGlobal('fetch', fetchMock);
    const doc = await loadOpenapi('http://example.com/spec.json');
    expect(fetchMock).toHaveBeenCalledWith('http://example.com/spec.json');
    expect(doc).toEqual(parsedSpec);
  });
});
