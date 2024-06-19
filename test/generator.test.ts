import { readFileSync } from 'fs'
import { join } from 'path'
import { generateClientCodes } from '../src'
import { expectMatchOutput } from './_utils'

const sharedSchema = Object.freeze({
  v3: JSON.parse(readFileSync(join(__dirname, 'schema/v3.json'), { encoding: 'utf8' })),
  v2: JSON.parse(readFileSync(join(__dirname, 'schema/v2.json'), { encoding: 'utf8' })),
})

describe('openapi parse', () => {
  it('should generate ts files', async () => {
    const c = await generateClientCodes({
      schema: sharedSchema.v3,
      format: true,
    })

    const outputDir = `./out/generator/normal`
    expectMatchOutput(c.fs.vol, outputDir)
  })

  it('should only generate path start with `/api/gen/clients`', async () => {
    const c = await generateClientCodes({
      schema: sharedSchema.v2,
      filter: (api) => api.path.startsWith('/api/gen/clients'),
      format: true,
    })

    const content = c.fs.vol.toJSON()
    const files = Object.keys(content)

    const isPrefixed = files.every(
      (file) => file.startsWith('/api/gen/clients') || file.endsWith('/index.ts'),
    )

    expect(isPrefixed).toBe(true)
  })
})
