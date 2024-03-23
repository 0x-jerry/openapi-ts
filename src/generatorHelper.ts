import { mkdirSync, writeFileSync } from 'fs'
import { parseOpenAPI, type APIConfig } from './parser'
import { type IFs } from 'memfs'
import path from 'path'
import { generateFromCtx } from './generator'

export interface GenerateClientCodesOptions {
  schema: any
  /**
   * @default 'api/generated'
   */
  output?: string

  /**
   * filter api
   * @param api
   */
  filter?: (api: APIConfig) => boolean

  format?: boolean
}

export async function generateClientCodes(opt: GenerateClientCodesOptions) {
  const option: Required<GenerateClientCodesOptions> = Object.assign(
    { output: 'api/generated', filter: () => true, format: false },
    opt,
  )

  const result = await parseOpenAPI(option.schema)

  result.apis = result.apis.filter(option.filter)

  const vfs = await generateFromCtx(result)

  if (opt.format) {
    await formatCodes(vfs.fs)
  }

  return { option, fs: vfs }
}

export async function generate(opt: GenerateClientCodesOptions) {
  const { option, fs: vfs } = await generateClientCodes(opt)

  writeToDisk(vfs.fs, option.output)
}

async function formatCodes(vfs: IFs, dir: string = '/') {
  const files = vfs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file.toString())
    const isDirectory = vfs.statSync(filePath).isDirectory()

    if (isDirectory) {
      await formatCodes(vfs, filePath)
    } else {
      const prettier = await import('prettier')

      const content = vfs.readFileSync(filePath)

      const formattedContent = await prettier.format(content.toString(), {
        parser: 'typescript',
      })

      vfs.writeFileSync(filePath, formattedContent)
    }
  }
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
