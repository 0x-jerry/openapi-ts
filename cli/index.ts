import { sliver } from '@0x-jerry/silver'
import ora from 'ora'
import { version } from '../package.json'
import { generate } from '../src'

sliver`
v${version}

o2ts <openapi-schema-url>, Convert openapi/swagger schema to typescript code, support ky/axios runtime out of box. ${defaultAction}

--output @string, Output dir for typescript code, default is 'src/api'.
--format @bool, Format the output code.
--style  @string, Generated code style, 'flatten' or 'nested', default is 'nested'.
`

async function defaultAction(
  params: string[],
  arg: { output?: string; format?: boolean; style?: string; adapter?: string },
) {
  const [schemaUrl] = params

  if (!schemaUrl) {
    console.log('Please specify the openapi schema url!')
    return false
  }

  const spinner = ora(`Fetching schema from ${schemaUrl}`).start()

  const swaggerSchema = await (await fetch(schemaUrl)).json()

  spinner.stop()

  const apiStyle = arg.style === 'flatten' ? 'flatten' : 'nested'

  await generate({
    ...arg,
    output: arg.output ?? 'src/api',
    schema: swaggerSchema,
    apiStyle,
  })
}
