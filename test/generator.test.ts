import { readFileSync } from 'fs'
import { join } from 'path'
import { generateClientCodes } from '../src'

const sharedSchema = Object.freeze({
  v3: JSON.parse(readFileSync(join(__dirname, 'schema/v3.json'), { encoding: 'utf8' })),
  v2: JSON.parse(readFileSync(join(__dirname, 'schema/v2.json'), { encoding: 'utf8' })),
})

describe('openapi parse', () => {
  it('should generate ts files', async () => {
    const c = await generateClientCodes({
      schema: sharedSchema.v3,
    })

    const content = c.fs.vol.toJSON()

    expect(content).toMatchFileSnapshot('./out/generator/normal.fs.json')
  })
})
