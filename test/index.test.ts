import { readFileSync } from 'fs'
import { join } from 'path'
import { generateAPIList, parseOpenAPI } from '../src'

const sharedSchema = Object.freeze({
  v3: JSON.parse(readFileSync(join(__dirname, 'schema/v3.json'), { encoding: 'utf8' })),
  v2: JSON.parse(readFileSync(join(__dirname, 'schema/v2.json'), { encoding: 'utf8' })),
})

describe('openapi parse', () => {
  it('should parse OpenAPI v3', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v3)

    expect(ctx.apis.length).toBe(2)
    expect(JSON.stringify(ctx.apis, null, 2)).toMatchFileSnapshot('./out/json/v3.json')
  })

  it('should parse Swagger v2', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v2)

    expect(ctx.apis.length).toBe(7)
    expect(JSON.stringify(ctx.apis, null, 2)).toMatchFileSnapshot('./out/json/v2.json')
  })

  it('should generate api code for Swagger v2', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v2)

    expect(generateAPIList(ctx)).toMatchFileSnapshot('./out/ts/v2.ts')
  })

  it('should generate api code for OpenAPI v3', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v3)

    expect(generateAPIList(ctx)).toMatchFileSnapshot('./out/ts/v3.ts')
  })

  it('should generate api code with generic type', async () => {
    const ctx = await parseOpenAPI(sharedSchema.v2)

    expect(
      generateAPIList(ctx, {
        adaptorName: 'http',
        parameters: {
          body: {
            wrapperType: 'BodyWrapper',
          },
          query: {
            wrapperType: 'QueryWrapper',
          },
          param: {
            wrapperType: 'ParamWrapper',
          },
        },
      })
    ).toMatchFileSnapshot('./out/ts/wrapGenericType.ts')
  })
})
