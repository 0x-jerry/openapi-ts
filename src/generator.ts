import type { SchemaObject } from 'openapi-typescript'
import type { ParserContext, APIConfig, APIParameterConfig } from './parser'
import { convertPathToName, getFnResult } from './utils'
import { quicktype, InputData, JSONSchemaInput, FetchingJSONSchemaStore } from 'quicktype-core'
import { PascalCase } from '@0x-jerry/utils'

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends {} ? DeepPartial<T[P]> : T[P]
}

export type WrapperGenericType = string | ((opt: SchemaObject) => string | undefined)

export interface ParameterConfig {
  name: string
  wrapperType?: WrapperGenericType
}

export interface ParametersConfig {
  query: ParameterConfig
  body: ParameterConfig
  param: ParameterConfig
}

export interface GeneratorConfig extends GenerateApiNameOption {
  adaptorName: string
  parameters: ParametersConfig
}

export function generateParameterType(
  ctx: ParserContext,
  parameterSchema: APIParameterConfig,
  opt: ParameterConfig
): string {
  if (!parameterSchema) return ''

  const typeName = parameterSchema.name

  let type = `${ctx.name}["${typeName}"]`

  const wrapperType = getFnResult(opt.wrapperType, parameterSchema.schema)

  if (wrapperType) {
    type = `${wrapperType}<${type}>`
  }

  return `${opt.name}: ${type}`
}

export function generateRequestParameters(
  ctx: ParserContext,
  api: APIConfig,
  opt: ParametersConfig
): string {
  const params: string[] = []

  if (api.bodyTypeIsFormData) {
    params.push(`${opt.body.name}: FormData`)
  } else if (api.bodyType) {
    params.push(generateParameterType(ctx, api.bodyType, opt.body))
  }

  if (api.queryType) {
    params.push(generateParameterType(ctx, api.queryType, opt.query))
  }

  if (api.paramsType) {
    params.push(generateParameterType(ctx, api.paramsType, opt.param))
  }

  return params.join(', ')
}

export interface GenerateApiNameOption {
  pathPrefix: Record<string, string | undefined>
}

export function generateApiName(api: APIConfig, opt?: Partial<GenerateApiNameOption>) {
  let pathName = api.name

  if (opt?.pathPrefix) {
    const hit = isMatchedPrefix(api.path, opt.pathPrefix)

    if (hit) {
      const originName = convertPathToName(hit.prefix)
      pathName = api.name.replace(originName, hit.name)
    }
  }

  return pathName + (api.method === 'get' ? '' : PascalCase(api.method))
}

export function generateResponseType(ctx: ParserContext, api: APIConfig): string {
  if (!api.responseType) return 'void'

  return `${`${ctx.name}["${api.responseType.name}"]`}`
}

const parseParamReg = /\{([^}]+)\}/g

export function generateRequestUrl(api: APIConfig, opt: GeneratorConfig): string {
  return api.path.replace(parseParamReg, `\${${opt.parameters.param.name}.\$1}`)
}

export async function generateModels(ctx: ParserContext) {
  const schema: SchemaObject = {
    ...ctx.schema,
    type: 'object',
    properties: ctx.defs,
    required: Object.keys(ctx.defs),
  }

  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

  await schemaInput.addSource({ name: ctx.name, schema: JSON.stringify(schema) })

  const inputData = new InputData()
  inputData.addInput(schemaInput)

  const option: any = {
    // typescript
    'just-types': true,
    'runtime-typecheck': false,
  }

  const r = await quicktype({
    inputData,
    lang: 'TypeScript',
    rendererOptions: option,
  })

  return r.lines.join('\n')
}

export function generateApi(ctx: ParserContext, generator: (api: APIConfig) => string) {
  const codes = ctx.apis.map(generator).filter(Boolean)

  return codes.join('\n\n')
}

export function generateAPIList(ctx: ParserContext, option?: DeepPartial<GeneratorConfig>) {
  const conf = createGeneratorConfig(option)

  const hasPathPrefixConfig = !!Object.keys(conf.pathPrefix).length

  const apiCode = generateApi(ctx, (api) => {
    if (hasPathPrefixConfig && !isMatchedPrefix(api.path, conf.pathPrefix)) {
      return ''
    }

    const comments = [
      '/**',
      `* ${api.description || ''}`,
      '*',
      `* url path: ${api.path}`,
      api.bodyTypeIsFormData &&
      api.bodyType &&
      `* @param data FormData keys: [${Object.keys(
        ('properties' in api.bodyType.schema && api.bodyType.schema.properties) || {}
      ).join(', ')}]`,
      api.tags && `* @tags ${api.tags.join(', ')}`,
      '*/',
    ].filter(Boolean)

    const params = [
      `    url: \`${generateRequestUrl(api, conf)}\`,`,
      (api.bodyType || api.bodyTypeIsFormData) && `    data: ${conf.parameters.body.name},`,
      api.queryType && `    params: ${conf.parameters.query.name},`,
    ].filter(Boolean)

    const requestParameters = generateRequestParameters(ctx, api, conf.parameters)

    const apiFnName = generateApiName(api, {
      pathPrefix: conf.pathPrefix,
    })

    const code = [
      comments.join('\n'),
      `export function ${apiFnName}(${requestParameters}) {
  return ${conf.adaptorName}.${api.method}<${generateResponseType(ctx, api)}>({
${params.join('\n')}
  });
}`,
    ]

    return code.join('\n')
  })

  return apiCode
}

export function createGeneratorConfig(option?: DeepPartial<GeneratorConfig>): GeneratorConfig {
  return {
    adaptorName: option?.adaptorName || 'httpAdaptor',
    pathPrefix: option?.pathPrefix || {},
    parameters: {
      query: Object.assign(
        {
          name: 'query',
        } as ParameterConfig,
        option?.parameters?.query
      ),
      body: Object.assign(
        {
          name: 'data',
        } as ParameterConfig,
        option?.parameters?.body
      ),
      param: Object.assign(
        {
          name: 'params',
        } as ParameterConfig,
        option?.parameters?.param
      ),
    },
  }
}

// -------- utils

/**
 *
 * @param path
 * @param prefixConf
 */
function isMatchedPrefix(path: string, prefixConf: GenerateApiNameOption['pathPrefix']) {
  const prefixes = Object.keys(prefixConf)

  const key = prefixes.find((prefix) => path.startsWith(prefix))

  return key == null
    ? null
    : {
      prefix: key,
      name: prefixConf[key] || '',
    }
}
