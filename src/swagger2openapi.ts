// @ts-ignore
import swagger2openapi from 'swagger2openapi'
import type { OpenAPI3 } from 'openapi-typescript'

export function swaggerToOpenAPI(v2: any): Promise<OpenAPI3> {
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
