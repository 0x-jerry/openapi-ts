import path from 'node:path'
import { camelCase } from '@0x-jerry/utils'
import type { IFs } from 'memfs'
import type { Volume } from 'memfs/lib/volume'
import type { ParserContext } from '../parser'
import { generateFromCtx } from './core'

export interface GeneratorContext extends ParserContext {
  fs: IFs
  vol: Volume
}

export const generateNestedStyle = (ctx: GeneratorContext) => {
  return generateFromCtx({
    ...ctx,
    generateIndex: (ctx) => generateIndexFiles(ctx.fs),
    generateApiName(ctx, api) {
      return `$${api.method.toLowerCase()}`
    },
  })
}

function generateIndexFiles(vfs: IFs) {
  return _generateIndexFiles(vfs, '/')

  function _generateIndexFiles(vfs: IFs, input: string) {
    const files = vfs.readdirSync(input) as string[]

    const hasIndex = files.includes('index.ts')

    if (hasIndex) {
      console.error('Can not create index file, for:', input)
      return
    }

    {
      // generate index file
      const tsFiles = files.filter((n) => n.endsWith('.ts'))
      const theSameNameFolder = files.filter((item) => tsFiles.includes(`${item}.ts`))

      // biome-ignore lint/complexity/noForEach: <explanation>
      theSameNameFolder.forEach((name) => {
        const _file = path.join(input, `${name}.ts`)
        let code = vfs.readFileSync(_file)
        code = [code, `export * from './${name}/index.ts'`].join('\n\n')

        vfs.writeFileSync(_file, code)
      })

      const includeFiles = files.filter((n) => !theSameNameFolder.includes(n))

      const indexFileCodes: string[] = includeFiles.map((item) => {
        let name = item.replace(/\.ts$/, '').replace(/\.\w/g, (n) => n[1].toUpperCase())
        name = camelCase(name)
        name = name.replace(/-/g, '_')

        return `export * as ${name} from './${item}'`
      })

      const codes = ['//@ts-ignore\n//@ts-nocheck', ...indexFileCodes]

      vfs.writeFileSync(path.join(input, 'index.ts'), codes.join('\n'))
    }

    for (const file of files) {
      const _input = path.join(input, file.toString())
      const isDirectory = vfs.statSync(_input).isDirectory()

      if (isDirectory) {
        _generateIndexFiles(vfs, _input)
      }
    }
  }
}
