import { validate } from '@hyperjump/json-schema/openapi-3-1';

export type Json = string | number | boolean | null | JsonObject | Json[];
export type JsonObject = {
  [property: string]: Json;
};

export async function isValidOpenapiSchema(doc: unknown): Promise<boolean> {
  const response = await validate('https://spec.openapis.org/oas/3.1/schema-base', doc as unknown as Json);
  if (response.valid) {
    return true;
  } else {
    return false;
  }
}
