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
})
```

2. Implement custom API adaptor `api/_http.ts`

```ts
export interface Config {
  customOption?: any
}

interface APIParam {
  url: string
  /**
   * request body
   */
  data?: any
  /**
   * query
   */
  query?: any
  /**
   * custom config
   */
  config?: Config
}

export const _http = {
  post<T>(data: APIParam) {
    throw new Error('Not implement')
  },
  get<T>(data: APIParam) {
    throw new Error('Not implement')
  },
  put<T>(data: APIParam) {
    throw new Error('Not implement')
  },
  delete<T>(data: APIParam) {
    throw new Error('Not implement')
  },
  patch<T>(data: APIParam) {
    throw new Error('Not implement')
  },
}
```

3. Use generated code

```ts
import * as api from './api/generated'

const resp = await api.segment.to.path.$get({...})
```
