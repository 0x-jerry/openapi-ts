/**
* Gets languages supported by the client generator
*
* url path: /api/gen/clients
* @tags clients
*/
export function ApiGenClients() {
  return http.get<APIModels["ApiGenClientsGetResponse"]>({
    url: `/api/gen/clients`,
  });
}

/**
* Returns options for a client library
*
* url path: /api/gen/clients/{language}
* @tags clients
*/
export function ApiGenClientsLanguage(params: ParamWrapper<APIModels["ApiGenClientsLanguageGetParam"]>) {
  return http.get<APIModels["ApiGenClientsLanguageGetResponse"]>({
    url: `/api/gen/clients/${params.language}`,
  });
}

/**
* Accepts a `GeneratorInput` options map for spec location and generation options
*
* url path: /api/gen/clients/{language}
* @tags clients
*/
export function ApiGenClientsLanguagePost(data: BodyWrapper<APIModels["ApiGenClientsLanguagePostRequestBody"]>, params: ParamWrapper<APIModels["ApiGenClientsLanguagePostParam"]>) {
  return http.post<APIModels["ApiGenClientsLanguagePostResponse"]>({
    url: `/api/gen/clients/${params.language}`,
    data: data,
  });
}

/**
* A valid `fileId` is generated by the `/clients/{language}` or `/servers/{language}` POST operations.  The fileId code can be used just once, after which a new `fileId` will need to be requested.
*
* url path: /api/gen/download/{fileId}
* @tags clients, servers
*/
export function ApiGenDownloadFileId(params: ParamWrapper<APIModels["ApiGenDownloadFileIdGetParam"]>) {
  return http.get<void>({
    url: `/api/gen/download/${params.fileId}`,
  });
}

/**
* Gets languages supported by the server generator
*
* url path: /api/gen/servers
* @tags servers
*/
export function ApiGenServers() {
  return http.get<APIModels["ApiGenServersGetResponse"]>({
    url: `/api/gen/servers`,
  });
}

/**
* Returns options for a server framework
*
* url path: /api/gen/servers/{framework}
* @tags servers
*/
export function ApiGenServersFramework(params: ParamWrapper<APIModels["ApiGenServersFrameworkGetParam"]>) {
  return http.get<APIModels["ApiGenServersFrameworkGetResponse"]>({
    url: `/api/gen/servers/${params.framework}`,
  });
}

/**
* Accepts a `GeneratorInput` options map for spec location and generation options.
*
* url path: /api/gen/servers/{framework}
* @tags servers
*/
export function ApiGenServersFrameworkPost(data: BodyWrapper<APIModels["ApiGenServersFrameworkPostRequestBody"]>, params: ParamWrapper<APIModels["ApiGenServersFrameworkPostParam"]>) {
  return http.post<APIModels["ApiGenServersFrameworkPostResponse"]>({
    url: `/api/gen/servers/${params.framework}`,
    data: data,
  });
}