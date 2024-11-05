import fsp from 'fs-extra'
import { parseOpenAPI, type APIConfig } from './parser'
import { createFsFromVolume, Volume, type IFs } from 'memfs'
import path from 'node:path'
import { generateFromCtx, type GenerateOption, type GeneratorContext } from './generator'

export interface GenerateClientCodesOptions {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  schema: any

  /**
   * @default 'nested'
   */
  apiStyle?: GenerateOption['style']

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

async function generateClientCodes(opt: GenerateClientCodesOptions) {
  const parser = await parseOpenAPI(opt.schema)

  if (opt.filter) {
    parser.apis = parser.apis.filter(opt.filter)
  }

  const vol = new Volume()
  const ctx: GeneratorContext = {
    ...parser,
    vol,
    fs: createFsFromVolume(vol),
  }

  await generateFromCtx(ctx, {
    style: opt.apiStyle || 'nested',
  })

  if (opt.format) {
    await formatCodes(ctx.fs)
  }

  return ctx
}

export async function generate(opt: GenerateClientCodesOptions) {
  const option: GenerateClientCodesOptions = Object.assign(
    {
      output: 'api/generated',
      format: false,
      clean: false,
    },
    opt,
  )

  const ctx = await generateClientCodes(option)

  if (option.output) {
    await writeToDisk(ctx.fs, option.output, {
      clean: opt.clean,
    })
  }
}

async function formatCodes(vfs: IFs, dir = '/') {
  const files = vfs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file.toString())
    const isDirectory = vfs.statSync(filePath).isDirectory()

    if (isDirectory) {
      await formatCodes(vfs, filePath)
    } else if (filePath.endsWith('.ts')) {
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
