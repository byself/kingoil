/**
 * 封装接口请求
 */
class Api {
  constructor() {
    this.baseUrl = 'http://dev.shforweb.com'
  }

  mregeUrl(url) {
    return this.baseUrl + url
  }

  query(options) {
    return $.ajax({
      url: options.url,
      type: options.method,
      data: options.data
    })
  }

  get(options) {
    options.url = this.mregeUrl(options.url)
    return this.query({
      ...options,
      method: 'GET'
    })
  }

  post(options) {
    options.url = this.mregeUrl(options.url)
    return this.query({
      ...options,
      method: 'POST'
    })
  }
}
