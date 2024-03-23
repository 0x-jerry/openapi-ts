import type { SchemaObject } from 'openapi-typescript'
import { compile } from 'json-schema-to-typescript'

export async function generateInterface(name: string, schema: SchemaObject) {
  const result = await compile(schema as any, name, {
    bannerComment: '',
    format: false,
    unknownAny: true,
    unreachableDefinitions: false,
  })

  return result
}
