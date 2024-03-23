import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { generateClientCodes } from '../src'
import { expectMatchOutput } from './_utils'

const sharedSchema = Object.freeze({
  v3: JSON.parse(readFileSync(join(__dirname, 'schema/v3.json'), { encoding: 'utf8' })),
  v2: JSON.parse(readFileSync(join(__dirname, 'schema/v2.json'), { encoding: 'utf8' })),
})

describe('fixtures', () => {
  const fixtureDir = join(__dirname, 'fixtures')
  const files = readdirSync(fixtureDir)

  for (const file of files) {
    it(`fixture: ${file}`, async () => {
      const fixtureFile = join(fixtureDir, file)
      const fileContent = await readFile(fixtureFile, { encoding: 'utf-8' })
      const schema = JSON.parse(fileContent)

      const c = await generateClientCodes({
        schema: schema,
        format: true,
      })

      const outputDir = `./out/fixtures/${file.slice(0, -5 /* remove .json */)}`
      expectMatchOutput(c.fs.vol, outputDir)
    })
  }
})
