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
import { getRef } from './helper'
import { PascalCase, toArray } from '@0x-jerry/utils'
import { unifySchema } from './normalize'
import { convertPathToName } from './utils'

export const METHODS = [
  //
  'get',
  'put',
  'post',
  'delete',
  'patch',
] as const

export type APIMethod = (typeof METHODS)[number]

export type InType = 'query' | 'header' | 'path' | 'cookie' | 'formData' | 'body'

export interface APIParameterConfig {
  name: string
  schema: SchemaObject
}

export interface APIConfig {
  name: string
  summary?: string

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

  types: Record<string, SchemaObject>
}

export interface ParserContext {
  /**
   * openapi v3 schema
   */
  schema: OpenAPI3

  /**
   * api config list
   */
  apis: APIConfig[]
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
    apis: [],
  }

  parsePaths(ctx, ctx.schema.paths || {})

  return ctx
}

function parsePaths(ctx: ParserContext, paths: PathsObject) {
  for (const [path, _conf] of Object.entries(paths)) {
    const conf = getRef(ctx, _conf)
    const methods = Object.keys(conf).filter((m: any) => METHODS.includes(m)) as APIMethod[]

    for (const method of methods) {
      const op = getRef(ctx, conf[method])

      if (!op) return

      const api = parseAPI(
        ctx,
        {
          // inherit description
          ...op,
        },
        path,
        method,
      )

      ctx.apis.push(api)
    }
  }
}

function parseAPI(ctx: ParserContext, op: OperationObject, path: string, method: APIMethod) {
  const params = toArray(op.parameters || []).map((n) => getRef(ctx, n))

  const api: APIConfig = {
    name: convertPathToName(path),
    summary: op.summary,
    description: op.description,
    tags: op.tags,
    path: path,
    method: method,
    bodyTypeIsFormData: method === 'get' ? false : isFormData(ctx, getRef(ctx, op.requestBody)),
    types: {},
  }

  const paramsTypeSchema = parsePathParams(params, path)
  if (paramsTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'Param'
    addApiTypeDef(api, name, paramsTypeSchema)

    api.paramsType = {
      name,
      schema: paramsTypeSchema,
    }
  }

  const queryTypeSchema = parseQueryParams(params)
  if (queryTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'Query'
    addApiTypeDef(api, name, queryTypeSchema)

    api.queryType = {
      name,
      schema: queryTypeSchema,
    }
  }

  const bodyTypeSchema =
    method === 'get' ? null : parseRequestBodyType(ctx, getRef(ctx, op.requestBody))
  if (bodyTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'RequestBody'
    addApiTypeDef(api, name, bodyTypeSchema)

    api.bodyType = {
      name,
      schema: bodyTypeSchema,
    }
  }

  const responseTypeSchema = parseResponseType(ctx, op.responses)
  if (responseTypeSchema) {
    const name = api.name + PascalCase(api.method) + 'Response'
    addApiTypeDef(api, name, responseTypeSchema)

    api.responseType = {
      name,
      schema: responseTypeSchema,
    }
  }

  return api
}

function addApiTypeDef(api: APIConfig, name: string, schema: SchemaObject) {
  api.types[name] = schema
}

function parseResponseType(
  ctx: ParserContext,
  responses?: Record<string, ReferenceObject | ResponseObject>,
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
  body: RequestBodyObject | undefined,
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
