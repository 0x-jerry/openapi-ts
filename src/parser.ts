import type {
  MediaTypeObject,
  OpenAPI3,
  OperationObject,
  ParameterObject,
  PathsObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from 'openapi-typescript'
import { swaggerToOpenAPI } from './swagger2openapi'
import { convertPathToName } from './utils'
import { cloneDeep } from 'lodash-es'
import { getRef } from './helper'
import fetch from 'node-fetch'
import { PascalCase } from '@0x-jerry/utils'

export const METHODS = [
  'get',
  'put',
  'post',
  'delete',
  // 'options',
  // 'head',
  'patch',
  // 'trace',
] as const

export type APIMethod = (typeof METHODS)[number]

export type InType = 'query' | 'header' | 'path' | 'cookie' | 'formData' | 'body'

export interface APIParameterConfig {
  name: string
  schema: SchemaObject
}

export interface APIConfig {
  /**
   * api function name
   */
  name: string

  tags?: string[]

  description?: string
  /**
   * api url path
   */
  path: string

  method: APIMethod

  /**
   * request path parameters
   *
   * ex. `/user/{id}`
   */
  paramsType?: APIParameterConfig

  /**
   * request query parameters
   *
   * ex. `/user?id=?`
   */
  queryType?: APIParameterConfig

  /**
   * request body, only support json format
   */
  bodyType?: APIParameterConfig

  bodyTypeIsFormData: boolean

  responseType?: APIParameterConfig
}

export interface ParserContext {
  /**
   * export interface name
   */
  name: string

  /**
   * openapi v3 schema
   */
  schema: OpenAPI3

  /**
   * api config list
   */
  apis: APIConfig[]

  /**
   * interface config
   */
  defs: Record<string, SchemaObject>

  /**
   * interface name map
   */
  defsMap: Map<SchemaObject, string>
}

export interface ParseOpenAPIOption {
  /**
   * use api to convert schema
   */
  forceUseApi?: boolean
}

export async function parseOpenAPI(schema: any, opt?: ParseOpenAPIOption) {
  const ctx: ParserContext = {
    schema: await unifySchema(schema, opt?.forceUseApi),
    name: 'APIModels',
    apis: [],
    defs: {},
    defsMap: new Map(),
  }

  parsePaths(ctx, ctx.schema.paths || {})

  return ctx
}

async function unifySchema(schema: any, force?: boolean): Promise<OpenAPI3> {
  if (force) {
    return useApiConvertSchema(schema)
  }

  const isV2 = schema.swagger === '2.0'

  if (!isV2) {
    return cloneDeep(schema as OpenAPI3)
  }

  try {
    const result = await swaggerToOpenAPI(schema)

    return cloneDeep(result)
  } catch (error) {
    // ignore error
    return useApiConvertSchema(schema)
  }
}

/**
 *
 * use api to convert: https://converter.swagger.io/#/Converter/convertByContent
 *
 * @param schema
 * @returns
 */
async function useApiConvertSchema(schema: any) {
  const resp = await fetch('https://converter.swagger.io/api/convert', {
    method: 'post',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schema),
  })

  const result = (await resp.json()) as OpenAPI3

  return result
}

function parsePaths(ctx: ParserContext, paths: PathsObject) {
  for (const [path, _conf] of Object.entries(paths)) {
    const conf = getRef(ctx, _conf)
    const methods = Object.keys(conf).filter((m: any) => METHODS.includes(m)) as APIMethod[]

    for (const method of methods) {
      const op = conf[method]

      if (!op) return

      const api = parseAPI(
        ctx,
        {
          // inherit description
          ...op,
        },
        path,
        method
      )

      ctx.apis.push(api)
    }
  }
}

function parseAPI(ctx: ParserContext, op: OperationObject, path: string, method: APIMethod) {
  const params = op.parameters?.map((n) => getRef(ctx, n)) || []

  const api: APIConfig = {
    name: convertPathToName(path),
    description: op.description || op.summary,
    tags: op.tags,
    path: path,
    method: method,
    bodyTypeIsFormData: method === 'get' ? false : isFormData(ctx, getRef(ctx, op.requestBody)),
  }

  const paramsTypeSchema = parsePathParams(params, path)
  if (paramsTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'Param'
    addTypeDef(ctx, name, paramsTypeSchema)

    api.paramsType = {
      name,
      schema: paramsTypeSchema,
    }
  }

  const queryTypeSchema = parseQueryParams(params)
  if (queryTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'Query'
    addTypeDef(ctx, name, queryTypeSchema)

    api.queryType = {
      name,
      schema: queryTypeSchema,
    }
  }

  const bodyTypeSchema =
    method === 'get' ? null : parseRequestBodyType(ctx, getRef(ctx, op.requestBody))
  if (bodyTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'RequestBody'
    addTypeDef(ctx, name, bodyTypeSchema)

    api.bodyType = {
      name,
      schema: bodyTypeSchema,
    }
  }

  const responseTypeSchema = parseResponseType(ctx, op.responses)
  if (responseTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'Response'
    addTypeDef(ctx, name, responseTypeSchema)

    api.responseType = {
      name,
      schema: responseTypeSchema,
    }
  }

  return api
}

function addTypeDef(ctx: ParserContext, name: string, schema: SchemaObject) {
  ctx.defs[name] = schema

  if (!ctx.defsMap.get(schema)) {
    ctx.defsMap.set(schema!, name)
  }
}

function parseResponseType(
  ctx: ParserContext,
  responses?: Record<string, ReferenceObject | ResponseObject>
) {
  const content = getRef(ctx, responses?.['200'])?.content

  let schema = (content?.['application/json'] || content?.['*/*'])?.schema

  schema = getRef(ctx, schema)

  return schema || null
}

function isFormData(ctx: ParserContext, body: RequestBodyObject | undefined): boolean {
  const contentType = getRef(ctx, body?.content)

  if (!contentType) return false

  return (
    !(contentType['*/*'] || contentType['application/json']) && !!contentType['multipart/form-data']
  )
}

function parseRequestBodyType(
  ctx: ParserContext,
  body: RequestBodyObject | undefined
): SchemaObject | null {
  const contentType = getRef(ctx, body?.content)

  if (!contentType) return null

  const content = (contentType['*/*'] ||
    contentType['application/json'] ||
    contentType['multipart/form-data']) as MediaTypeObject

  return getRef(ctx, content?.schema!)
}

function parseQueryParams(parameters: ParameterObject[]): SchemaObject | null {
  const types = parameters.filter((n) => n.in === 'query' && n.schema && n.name)

  if (!types.length) return null

  const schema: SchemaObject = {
    type: 'object',
    properties: {},
  }

  types.forEach((param) => {
    schema.properties![param.name!] = {
      description: param.description,
      ...param.schema!,
    }
  })

  return schema
}

function parsePathParams(params: ParameterObject[], path: string): SchemaObject | null {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Assertions#other_assertions
  const pathParamsList: string[] = path.match(/(?<=\{)[a-z0-9_]+(?=\})/gi) || []

  if (!pathParamsList.length) return null

  const schema: SchemaObject = {
    type: 'object',
    properties: {},
  }

  const pathParams = params.filter((p) => p.in === 'path' && p.name)

  pathParams.forEach((param) => {
    // @ts-ignore
    schema.properties![param.name!] = {
      description: param.description,
      ...param.schema,
    }

    pathParamsList.splice(pathParamsList.indexOf(param.name!), 1)
  })

  // add missing path parameters
  pathParamsList.forEach((name) => {
    schema.properties![name] = {
      type: 'string',
    }
  })

  schema.required = Object.keys(schema.properties!)

  return schema
}
