// @ts-ignore
// @ts-nocheck

import { _request, type RequestConfig } from "../_adapter.ts";

export interface TypeModel {
  GetResponse: string;
  [k: string]: unknown;
}

/**
 *
 *
 *
 *
 * url path: /
 */
export const $get = (config?: RequestConfig) => {
  return _request<TypeModel["GetResponse"]>({
    method: "get",
    url: `/`,
    config,
  });
};
