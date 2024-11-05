// @ts-ignore
// @ts-nocheck

import { _request, type RequestConfig } from "../../_adapter.ts";

export interface TypeModel {
  ApiPayGetResponse: Employee;
  ApiPayPostRequestBody: {
    /**
     * file
     */
    file: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export interface Employee {
  id?: string;
  name?: string;
}

/**
 *
 *
 *
 *
 * url path: /api/Pay
 * @tags Pay
 */
export const apiPayGet = (config?: RequestConfig) => {
  return _request<TypeModel["ApiPayGetResponse"]>({
    method: "get",
    url: `/api/Pay`,
    config,
  });
};

/**
 *
 *
 *
 *
 * url path: /api/Pay
 * @param data FormData keys: [file]
 * @tags Pay
 */
export const apiPayPost = (data: FormData, config?: RequestConfig) => {
  return _request<void>({
    method: "post",
    url: `/api/Pay`,
    body: data,
    config,
  });
};
