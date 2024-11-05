# OpenAPI Code Generator

This package provide a quick way to transform OpenAPI schema or Swagger schema to client typescript code.

## Usage

1. Generate client typescript code

```ts
import { generate } from '@0x-jerry/openapi-ts'

const apiUrl = 'http://doc-url/api-docs'

const swaggerSchema = await (await fetch(apiUrl)).json()

await generate({
  schema: swaggerSchema,
  output: 'api/generated',
  format: true,
  clean: true,
})
```

2. Implement custom API adapter `api/_adapter.ts`

```ts
import { type RequestParams } from '@0x-jerry/openapi-ts/runtime'

export interface Config {
  customOption?: any
}

export const _request = async (data: RequestParams<Config>) => {
  const resp = await doRequest({
    url: data.url,
    method: data.method,
    searchParams: data.query,
    body: data.data,
    config: data.config,
  })

  return resp
}
```

3. Use generated code

```ts
import * as api from './api/generated'

const resp = await api.segment.to.path.$get({...})
```
