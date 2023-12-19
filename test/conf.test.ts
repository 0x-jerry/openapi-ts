import { readFileSync } from 'fs'
import { join } from 'path'
import { generateAPIList, parseOpenAPI } from '../src'

const sharedSchema = Object.freeze({
  v3: JSON.parse(readFileSync(join(__dirname, 'schema/v3.json'), { encoding: 'utf8' })),
  v2: JSON.parse(readFileSync(join(__dirname, 'schema/v2.json'), { encoding: 'utf8' })),
})

describe('openapi parse', () => {
  it('should replace api path prefix', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v2)

    expect(
      generateAPIList(ctx, {
        pathPrefix: {
          '/api/gen/clients': 'WeChat',
        },
      })
    ).toMatchFileSnapshot('./out/ts/pathPrefix.ts')
  })
})
