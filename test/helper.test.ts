import { readFile } from 'fs/promises'
import path from 'path'
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

    expect(ctx.schema.components!.schemas!.Employee).toMatchSnapshot()
  })
})
