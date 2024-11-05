import type { ParserContext } from '../parser'
import type { IFs } from 'memfs'
import path from 'node:path'
import type { Volume } from 'memfs/lib/volume'
import { camelCase, PascalCase } from '@0x-jerry/utils'
import { generateFromCtx } from './core'
import { OPENAPI_PARAM_REG } from './shared'

export interface GeneratorContext extends ParserContext {
  fs: IFs
  vol: Volume
}

export const generateFlattenStyle = (ctx: GeneratorContext) => {
  return generateFromCtx({
    ...ctx,
    generateIndex: (ctx) => generateIndexFiles(ctx.fs),
    generateApiName(ctx, api) {
      const apiPath = api.path
        .replace(OPENAPI_PARAM_REG, (n) => n.slice(1, -1))
        .replace(/\.\w/g, (n) => n.slice(1).toUpperCase())

      const name =
        apiPath
          .split('/')
          .map((segment) => PascalCase(segment))
          .join('') + PascalCase(api.method.toLowerCase())

      return camelCase(name)
    },
  })
}

/**
 * only export functions
 *
 */
function generateIndexFiles(vfs: IFs) {
  /**
   * Match `export const apiV1alpha1AnnotationsettingsGet =`
   */
  const FUNCTION_NAME_REGEXP = /export\s+const\s+([_\w\d]+)\s+/g

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

      const extraExports: string[] = []
      // biome-ignore lint/complexity/noForEach: <explanation>
      theSameNameFolder.forEach((name) => {
        extraExports.push(`export * from './${name}/index.ts'`)
      })

      const includeFiles = files.filter((n) => !theSameNameFolder.includes(n))

      const indexFileCodes: string[] = includeFiles.map((item) => {
        if (!item.endsWith('.ts')) {
          return `export * from './${item}'`
        }

        const content = vfs.readFileSync(path.join(input, item)).toString('utf-8')

        const funcitonNames: string[] = []
        content.replace(FUNCTION_NAME_REGEXP, (raw, p1) => {
          funcitonNames.push(p1)

          return raw
        })

        return `export {${funcitonNames.join(',')}} from './${item}'`
      })

      const codes = ['//@ts-ignore\n//@ts-nocheck', ...indexFileCodes, ...extraExports]

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
