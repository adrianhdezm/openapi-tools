import type { Json } from '@hyperjump/json-pointer';
import { validate } from '@hyperjump/json-schema/openapi-3-1';

export async function isValidOpenapiSchema(doc: unknown): Promise<boolean> {
  const response = await validate('https://spec.openapis.org/oas/3.1/schema-base', doc as unknown as Json);
  if (response.valid) {
    return true;
  } else {
    return false;
  }
}
