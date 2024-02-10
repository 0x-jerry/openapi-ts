// @ts-ignore
import swagger2openapi from 'swagger2openapi'
import type { OpenAPI3 } from 'openapi-typescript'
import { cloneDeep } from 'lodash-es'

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

function swaggerToOpenAPI(v2: any): Promise<OpenAPI3> {
  return new Promise((resolve, reject) => {
    swagger2openapi.convertObj(
      v2,
      {
        patch: true,
      },
      (err: Error | null, options: any) => {
        if (err) reject(err)
        else resolve(options.openapi)
      }
    )
  })
}

export async function unifySchema(schema: any, force?: boolean): Promise<OpenAPI3> {
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
