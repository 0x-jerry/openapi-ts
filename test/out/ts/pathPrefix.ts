/**
* Gets languages supported by the client generator
*
* url path: /api/gen/clients
* @tags clients
*/
export function WeChat() {
  return httpAdaptor.get<APIModels["ApiGenClientsGetResponse"]>({
    url: `/api/gen/clients`,
  });
}

/**
* Returns options for a client library
*
* url path: /api/gen/clients/{language}
* @tags clients
*/
export function WeChatLanguage(params: APIModels["ApiGenClientsLanguageGetParam"]) {
  return httpAdaptor.get<APIModels["ApiGenClientsLanguageGetResponse"]>({
    url: `/api/gen/clients/${params.language}`,
  });
}

/**
* Accepts a `GeneratorInput` options map for spec location and generation options
*
* url path: /api/gen/clients/{language}
* @tags clients
*/
export function WeChatLanguagePost(data: APIModels["ApiGenClientsLanguagePostRequestBody"], params: APIModels["ApiGenClientsLanguagePostParam"]) {
  return httpAdaptor.post<APIModels["ApiGenClientsLanguagePostResponse"]>({
    url: `/api/gen/clients/${params.language}`,
    data: data,
  });
}