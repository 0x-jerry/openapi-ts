import { groupBy } from 'lodash-es'
import type { ParserContext, APIConfig, APIParameterConfig } from './parser'
import { type IFs } from 'memfs'
import path, { dirname } from 'path'
import type { SchemaObject } from 'openapi-typescript'
import { generateInterface } from './generateTypes'
import { createSpinner } from './utils'
import type { Volume } from 'memfs/lib/volume'
import { camelCase } from '@0x-jerry/utils'

const config = {
  nameMapper: {
    requestAdapterName: '_request',
    apiModel: 'TypeModel',
    query: 'query',
    body: 'data',
    parameters: 'params'
  },
  adapterPath: '../_adapter.ts'
}

export interface GeneratorContext extends ParserContext {
  fs: IFs
  vol: Volume
}

export async function generateFromCtx(ctx: GeneratorContext) {
  const groupedApis = Object.values(groupBy(ctx.apis, (n) => n.path))

  const spinner = createSpinner(
    'Generate code from spec',
    groupedApis.length
  ).start()

  for (const groupedApi of groupedApis) {
    await generateApiByPath(ctx, groupedApi, ctx.fs)
    spinner.plusOne()
  }

  spinner.done()

  generateIndexFiles(ctx.fs)
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
      const theSameNameFolder = files.filter((item) =>
        tsFiles.includes(item + '.ts')
      )

      theSameNameFolder.forEach((name) => {
        const _file = path.join(input, name + '.ts')
        let code = vfs.readFileSync(_file)
        code = [code, `export * from './${name}/index.ts'`].join('\n\n')

        vfs.writeFileSync(_file, code)
      })

      const includeFiles = files.filter((n) => !theSameNameFolder.includes(n))

      const indexFileCodes: string[] = includeFiles.map((item) => {
        const name = camelCase(item.replace(/\.ts$/, ''))

        return `export * as ${name} from './${item}'`
      })

      const codes = [`//@ts-ignore\n//@ts-nocheck`, ...indexFileCodes]

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

async function generateApiByPath(
  ctx: ParserContext,
  groupedApi: APIConfig[],
  fs: IFs
) {
  const apiPath = groupedApi.at(0)!.path
  const outputFilePath = normalizeFilePath(apiPath)

  const adapterRelativePath = path
    .join(path.relative(path.dirname(outputFilePath), '/'), config.adapterPath)
    .replaceAll('\\', '/')

  const codes: string[] = [
    `// @ts-ignore\n// @ts-nocheck`,
    `import { ${config.nameMapper.requestAdapterName}, type RequestConfig } from '${adapterRelativePath}'`
  ]

  const types = Object.assign({}, ...groupedApi.map((item) => item.types))

  const schema: SchemaObject = {
    ...ctx.schema,
    type: 'object',
    properties: types,
    required: Object.keys(types)
  }

  const typeCodes = await generateInterface(config.nameMapper.apiModel, schema)
  codes.push(typeCodes)

  const apiCodes = groupedApi
    .map((api) => generateApiMethodCode(api))
    .join('\n\n')
  codes.push(apiCodes)

  fs.mkdirSync(dirname(outputFilePath), { recursive: true })

  fs.writeFileSync(outputFilePath, codes.join('\n\n'))
}

function generateApiMethodCode(api: APIConfig) {
  const comments = [
    '/**',
    `* ${api.summary || ''}`,
    '*',
    `* ${api.description || ''}`,
    '*',
    `* url path: ${api.path}`,
    api.bodyTypeIsFormData &&
      api.bodyType &&
      `* @param data FormData keys: [${Object.keys(
        ('properties' in api.bodyType.schema &&
          api.bodyType.schema.properties) ||
          {}
      ).join(', ')}]`,
    api.tags && `* @tags ${api.tags.join(', ')}`,
    '*/'
  ].filter(Boolean)

  const params = [
    `method: '${api.method}',`,
    `    url: \`${generateRequestUrl(api)}\`,`,
    (api.bodyType || api.bodyTypeIsFormData) &&
      `    body: ${config.nameMapper.body},`,
    api.queryType && `    query: ${config.nameMapper.query},`,
    api.paramsType && `    params: ${config.nameMapper.parameters},`,
    'config,'
  ].filter(Boolean)

  const codes = [
    comments.join('\n'),
    `export const $${api.method.toLowerCase()} = (${generateRequestParameters(
      api
    )}) => {
    return ${config.nameMapper.requestAdapterName}<${generateResponseType(
      api
    )}>({
      ${params.join('\n')}
    })
  }`
  ]

  return codes.join('\n')
}

function generateRequestUrl(api: APIConfig): string {
  const parseParamReg = /\{([^}]+)\}/g

  return api.path.replace(
    parseParamReg,
    `\${${config.nameMapper.parameters}.\$1}`
  )
}

function normalizeFilePath(apiPath: string) {
  let filePath = apiPath
    .split('/')
    .map((item) => (/^\{[^\}]+\}$/.test(item) ? `_${item.slice(1, -1)}` : item))
    .join('/')

  if (filePath === '/') {
    filePath = '/_'
  }

  return filePath + '.ts'
}

interface ParameterConfig {
  name: string
}

export interface ParametersConfig {
  query: ParameterConfig
  body: ParameterConfig
  param: ParameterConfig
}

function generateRequestParameters(api: APIConfig): string {
  const params: string[] = []

  if (api.paramsType) {
    params.push(
      generateParameterType(api.paramsType, {
        name: config.nameMapper.parameters
      })
    )
  }

  if (api.bodyTypeIsFormData) {
    params.push(`${config.nameMapper.body}: FormData`)
  } else if (api.bodyType) {
    params.push(
      generateParameterType(api.bodyType, { name: config.nameMapper.body })
    )
  }

  if (api.queryType) {
    params.push(
      generateParameterType(api.queryType, { name: config.nameMapper.query })
    )
  }

  params.push(`config?: RequestConfig`)
  return params.join(', ')
}

function generateParameterType(
  parameterSchema: APIParameterConfig,
  opt: ParameterConfig
): string {
  if (!parameterSchema) return ''

  const typeName = parameterSchema.name

  let type = `${config.nameMapper.apiModel}["${typeName}"]`

  return `${opt.name}: ${type}`
}

function generateResponseType(api: APIConfig): string {
  if (!api.responseType) return 'void'

  return `${`${config.nameMapper.apiModel}["${api.responseType.name}"]`}`
}
