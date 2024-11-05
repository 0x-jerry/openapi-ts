import type { GeneratorContext } from './core'
import { generateFlattenStyle } from './generateFlattenStyle'
import { generateNestedStyle } from './generateNestedStyle'

export interface GenerateOption {
  style: 'nested' | 'flatten'
}

export async function generateFromCtx(ctx: GeneratorContext, opt: GenerateOption) {
  if (opt.style === 'flatten') {
    return generateFlattenStyle(ctx)
  }

  return generateNestedStyle(ctx)
}

export type { GeneratorContext }
