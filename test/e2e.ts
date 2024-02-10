import { generate } from '../src'

const apiUrl = 'https://0x-jerry.icu/_openapi'

const swaggerSchema = await (await fetch(apiUrl)).json()

await generate({
  schema: swaggerSchema,
  output: 'temp/generated',
})
