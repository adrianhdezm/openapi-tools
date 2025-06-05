export interface SpecLoader {
  load(source: string): Promise<unknown>;
}

class FileSpecLoader implements SpecLoader {
  async load(filePath: string): Promise<unknown> {
    const fs = await import('fs/promises');
    const yaml = (await import('js-yaml')).default;
    const raw = await fs.readFile(filePath, 'utf8');
    return filePath.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);
  }
}

class HttpSpecLoader implements SpecLoader {
  async load(url: string): Promise<unknown> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    const raw = await res.text();
    const yaml = (await import('js-yaml')).default;
    return url.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);
  }
}

export async function loadOpenapi(source: string): Promise<unknown> {
  const loader: SpecLoader = source.startsWith('http://') || source.startsWith('https://') ? new HttpSpecLoader() : new FileSpecLoader();
  return loader.load(source);
}
