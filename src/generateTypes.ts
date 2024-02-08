import type { SchemaObject } from 'openapi-typescript'
import { JSONSchemaInput, FetchingJSONSchemaStore, InputData, quicktype } from 'quicktype-core'

export async function generateInterface(name: string, schema: SchemaObject) {
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

  await schemaInput.addSource({ name: name, schema: JSON.stringify(schema) })

  const inputData = new InputData()
  inputData.addInput(schemaInput)

  const option: any = {
    // typescript
    'just-types': true,
    'runtime-typecheck': false,
  }

  const r = await quicktype({
    inputData,
    lang: 'TypeScript',
    rendererOptions: option,
  })

  return r.lines.join('\n')
}
