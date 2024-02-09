import { mkdirSync, writeFileSync } from 'fs'
import { parseOpenAPI } from './parser'
import { type IFs } from 'memfs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { generateFromCtx } from './generator'

export interface GenerateClientCodesOptions {
  schema: any
  /**
   * @default 'api/generated'
   */
  output?: string
}

export async function generateClientCodes(opt: GenerateClientCodesOptions) {
  const option: Required<GenerateClientCodesOptions> = Object.assign(
    { output: 'api/generated' },
    opt
  )

  const result = await parseOpenAPI(option.schema)

  const vfs = await generateFromCtx(result)

  return { option, fs: vfs }
}

export async function generate(opt: GenerateClientCodesOptions) {
  const { option, fs: vfs } = await generateClientCodes(opt)

  writeToDisk(vfs.fs, option.output)

  const biomeBin = path.join(
    fileURLToPath(import.meta.resolve('@biomejs/biome/package.json')),
    '../bin/biome'
  )

  spawnSync(biomeBin, 'format --write temp/generated'.split(' '))
}

function writeToDisk(vfs: IFs, output: string) {
  const out = path.resolve(output)

  return _writeToDisk(vfs, '/', out)

  function _writeToDisk(vfs: IFs, input: string, output: string) {
    const files = vfs.readdirSync(input)

    for (const file of files) {
      const _input = path.join(input, file.toString())
      const _out = path.join(output, file.toString())

      const isDirectory = vfs.statSync(_input).isDirectory()

      if (isDirectory) {
        _writeToDisk(vfs, _input, _out)
      } else {
        // write to disk
        mkdirSync(output, { recursive: true })

        writeFileSync(_out, vfs.readFileSync(_input))
      }
    }
  }
}
