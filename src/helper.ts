import type { OpenAPI3, ReferenceObject, SchemaObject } from 'openapi-typescript'
import { type Arrayable, ensureArray } from '@0x-jerry/utils'
import type { ParserContext } from './parser'

export interface ReplaceSchemaTypeConfig {
  type: string
  format?: string[]

  targetType: string
  targetFormat?: string
}

/**
 * Replace some type in the schema
 *
 * @example
 * transform number type to string type if format is 'int64'
 *
 * ```ts
 * fixRawType(ctx, [{
 *  type: 'number',
 *  format: ['int64'],
 *  targetType: 'string'
 * }])
 * ```
 *
 * @param ctx
 * @param opt
 */
export function replaceSchemaType(ctx: ParserContext, opt: Arrayable<ReplaceSchemaTypeConfig>) {
  const schemas: SchemaObject[] = Object.values(ctx.schema.components?.schemas || {})

  const conf = ensureArray(opt)

  // fix endless loop
  const visited = new Set<SchemaObject>()

  schemas.forEach((schema) => fixType(schema))

  function fixType(schema: SchemaObject) {
    if (visited.has(schema)) {
      return
    }

    visited.add(schema)

    if (!('type' in schema)) {
      return
    }

    if (schema.type === 'object') {
      for (const key in schema.properties) {
        fixType(getRef(ctx, schema.properties[key]))
      }
    } else if (schema.type === 'array') {
      if (schema.items) {
        const items = ensureArray(schema.items)
        for (const item of items) {
          fixType(getRef(ctx, item))
        }
      }
    } else {
      for (const item of conf) {
        const isTheSameType = schema.type === item.type
        const hasFormat = item.format ? item.format.includes(schema.format!) : true

        if (isTheSameType && hasFormat) {
          // @ts-ignore
          schema.type = item.targetType
          schema.format = item.targetFormat
        }

        console.log(isTheSameType, hasFormat, schema)
      }
    }
  }
}

export type DereferenceObject<T> = [T] extends [infer U | ReferenceObject] ? U : T

export function getRef<T>(
  ctx: {
    schema: OpenAPI3
  },
  type: T,
): DereferenceObject<T> {
  if (!isRef(type)) {
    return type as any
  }

  let r: any = ctx.schema

  const paths = type.$ref.split('/').slice(1)

  paths.forEach((key) => (r = r[key]))

  return getRef(ctx, r)
}

export function isRef(o: any): o is ReferenceObject {
  return !!o?.$ref
}
