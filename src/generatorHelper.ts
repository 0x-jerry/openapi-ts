import fsp from 'fs-extra'
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
   * Filter api
   * @param api
   */
  filter?: (api: APIConfig) => boolean

  /**
   * Format output code.
   */
  format?: boolean

  /**
   * Clean output dir before write file.
   */
  clean?: boolean
}

export async function generateClientCodes(opt: GenerateClientCodesOptions) {
  const option: Required<GenerateClientCodesOptions> = Object.assign(
    { output: 'api/generated', filter: () => true, format: false, clean: false },
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

  await writeToDisk(vfs.fs, option.output, {
    clean: opt.clean,
  })
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

      try {
        const formattedContent = await prettier.format(content.toString(), {
          parser: 'typescript',
        })
        vfs.writeFileSync(filePath, formattedContent)
      } catch (error) {
        console.warn('Format code failed:', filePath)
      }
    }
  }
}

async function writeToDisk(vfs: IFs, output: string, opt: { clean?: boolean } = {}) {
  const out = path.resolve(output)

  if (opt.clean && (await fsp.pathExists(out))) {
    await fsp.emptyDir(out)
  }

  return _writeToDisk(vfs, '/', out)

  async function _writeToDisk(vfs: IFs, input: string, output: string) {
    const files = vfs.readdirSync(input)

    for (const file of files) {
      const _input = path.join(input, file.toString())
      const _out = path.join(output, file.toString())

      const isDirectory = vfs.statSync(_input).isDirectory()

      if (isDirectory) {
        _writeToDisk(vfs, _input, _out)
      } else {
        // write to disk
        await fsp.ensureDir(output)

        await fsp.writeFile(_out, vfs.readFileSync(_input))
      }
    }
  }
}
