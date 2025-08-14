import { generate } from '../src'
import schema from './schema/halo.json'

await generate({
  apiStyle: 'flatten',
  schema: schema,
  output: 'temp/api',
  format: true,
  clean: true,
})
