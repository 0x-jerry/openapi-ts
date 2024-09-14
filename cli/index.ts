import ora from 'ora'
import { generate } from '../src'
import { sliver } from '@0x-jerry/silver'
import { version } from '../package.json'

sliver`
v${version}

o2ts <openapi-schema-url>, Convert openapi/swagger schema to typescript code, support ky/axios runtime out of box. ${defaultAction}

--output @string, Output dir for typescript code.

--format @bool, Format the output code.
`

async function defaultAction(params: string[], arg: { output?: string; format?: boolean }) {
  const [schemaUrl] = params
  if (!schemaUrl) {
    console.log('Please specify the openapi schema url!')
    return false
  }

  const spinner = ora(`Fetching schema from ${schemaUrl}`).start()

  const swaggerSchema = await (await fetch(schemaUrl)).json()

  spinner.stop()

  const { output = 'src/api', format = true } = arg

  await generate({
    schema: swaggerSchema,
    output: output,
    format: format,
  })
}
