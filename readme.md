# OpenAPI Code Generator

This package provide a quick way to transform OpenAPI schema or Swagger schema to client code.

## Usage

1. Generate client code and model code.

```ts
import { writeFileSync } from 'fs'
import fetch from 'node-fetch'
import {
  swaggerToOpenAPI,
  parseOpenAPI,
  generateAPIList,
  generateModels,
} from '@0x-jerry/openapi-ts'

const apiUrl = 'http://doc-url/api-docs'

main()

async function main() {
  const swaggerSchema = await (await fetch(apiUrl)).json()
  // convert swagger to openapi if needed
  const schema = await swaggerToOpenAPI(swaggerSchema)

  const ctx = parseOpenAPI(schema)

  // generate model file
  const defCode = await generateModels(ctx)
  writeFileSync('./api.model.ts', defCode)

  // generate client code file
  const code = generateAPIList(ctx)
  writeFileSync(
    './api.req.ts',
    [
      `import { ${ctx.name} } from './api.model';
import { httpAdaptor } from './api.adaptor';`,
      code,
    ].join('\n\n')
  )
}
```

2. implement custom API adaptor `api.adaptor.ts`

```ts
interface APIParam {
  url: string
  /**
   * request body
   */
  data?: any
  /**
   * query
   */
  params?: any
}

export const httpAdaptor = {
  post<T>(data: APIParam) {
    threw new Error('Not implement')
  },
  get<T>(data: APIParam) {
    threw new Error('Not implement')
  },
  put<T>(data: APIParam) {
    threw new Error('Not implement')
  },
  delete<T>(data: APIParam) {
    threw new Error('Not implement')
  },
  patch<T>(data: APIParam) {
    threw new Error('Not implement')
  },
}
```

## implement a custom code generator

```ts
import {
  generateApi,
  generateRequestUrl,
  generateRequestParameters,
  generateResponseType,
  createGeneratorConfig,
} from '@0x-jerry/openapi-ts'

const parameterNames = {
  requestBody: 'data',
  query: 'query',
  params: 'params',
}

export function customGenerateAPIList(ctx: ParserContext) {
  const opt = createGeneratorConfig(option)

  const apiCode = generateApi(ctx, (api) => {
    const comments = [
      '/**',
      `* ${api.description || ''}`,
      '*',
      `* url path: ${api.path}`,
      api.tags && `* @tags ${api.tags.join(', ')}`,
      '*/',
    ].filter(Boolean)

    const params = [
      `    url: \`${generateRequestUrl(api, opt)}\`,`,
      api.bodyType && `    data: ${opt.parameters.body.name},`,
      api.queryType && `    params: ${opt.parameters.query.name},`,
    ].filter(Boolean)

    const code = [
      comments.join('\n'),
      `export function ${api.name}(${generateRequestParameters(ctx, api, opt.parameters)}) {
  return ${opt.adaptorName}.${api.method}<${generateResponseType(ctx, api)}>({
${params.join('\n')}
  });
}`,
    ]

    return code.join('\n')
  })

  return apiCode
}
```
