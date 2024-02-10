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
   * custom config
   */
  config?: Config
}
