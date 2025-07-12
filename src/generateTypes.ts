import { compile } from 'json-schema-to-typescript'
import type { SchemaObject } from 'openapi-typescript'

export async function generateInterface(name: string, schema: SchemaObject) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const result = await compile(schema as any, name, {
    bannerComment: '',
    format: false,
    unknownAny: true,
    unreachableDefinitions: false,
  })

  return result
}
