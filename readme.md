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
  output: 'api',
  format: true,
  clean: true,
  adapter: 'axios'
})
```

2. Change adapter file `api/_adapter.ts` to suit your needs.

3. Use generated code

```ts
import * as api from './api/generated'

const resp = await api.segment.to.path.$get({...})
```
