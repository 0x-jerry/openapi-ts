import { tpl as axios } from './axios'
import { tpl as ky } from './ky'
import { tpl as native } from './native'

export const adapterTemplates: Record<string, string> = {
  ky,
  axios,
  native,
}
