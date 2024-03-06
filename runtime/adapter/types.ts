export interface RequestParams<Config> {
  /**
   * request path
   */
  url: string

  /**
   * request method
   */
  method: string

  /**
   * request body
   */
  data?: any

  /**
   * query
   */
  query?: any

  /**
   * path parameters
   */
  params?: any

  /**
   * custom config
   */
  config?: Config
}
