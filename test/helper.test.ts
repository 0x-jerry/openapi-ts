import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { replaceSchemaType } from '../src/helper'
import { parseOpenAPI } from '../src/parser'

describe('helper', () => {
  it('replaceSchemaType', async () => {
    const content = await readFile(path.join(import.meta.dirname, 'schema/v3.json'), 'utf8')

    const schema = JSON.parse(content)
    const ctx = await parseOpenAPI(schema)

    replaceSchemaType(ctx, {
      type: 'string',
      targetType: 'number',
    })

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    expect(ctx.schema.components!.schemas!.Employee).toMatchSnapshot()
  })
})
