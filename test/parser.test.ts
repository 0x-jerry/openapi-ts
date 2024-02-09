import { readFileSync } from 'fs'
import { join } from 'path'
import { parseOpenAPI } from '../src/parser'

const sharedSchema = Object.freeze({
  v3: JSON.parse(readFileSync(join(__dirname, 'schema/v3.json'), { encoding: 'utf8' })),
  v2: JSON.parse(readFileSync(join(__dirname, 'schema/v2.json'), { encoding: 'utf8' })),
})

describe('openapi parse', () => {
  it('should parse OpenAPI v3', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v3)

    expect(ctx.apis.length).toBe(2)
    expect(JSON.stringify(ctx.apis, null, 2)).toMatchFileSnapshot('./out/parser/v3.json')
  })

  it('should parse Swagger v2', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v2)

    expect(ctx.apis.length).toBe(7)
    expect(JSON.stringify(ctx.apis, null, 2)).toMatchFileSnapshot('./out/parser/v2.json')
  })
})
