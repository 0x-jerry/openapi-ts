/**
* 
*
* url path: /api/Pay
* @tags Pay
*/
export function ApiPay() {
  return httpAdaptor.get<APIModels["ApiPayGetResponse"]>({
    url: `/api/Pay`,
  });
}

/**
* 
*
* url path: /api/Pay
* @param data FormData keys: [file]
* @tags Pay
*/
export function ApiPayPost(data: FormData) {
  return httpAdaptor.post<void>({
    url: `/api/Pay`,
    data: data,
  });
}