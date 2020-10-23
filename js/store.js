// const config = {
//   'bet-amount': 5000, //下注金额
//   'update-interval': 5, // 每5s获取一次页面数据
//   basketball: {
//     session: 4, // 第几节
//     'left-time': 5, // 剩余时间5s
//     'score-diff': 10 // 两队比分差
//   }
// }

class Store {
  constructor() {
    /**
     * 1. 如果支持chrome.storage，则使用chrome.storage方式存储；
     * 2. 如果不支持，使用localStroage存储
     */
    this.type = 'chrome'

    /**
     * 实例化时就开始进行环境判断
     */
    this.check()
  }

  /**
   * 判断当前所支持的环境
   */
  check() {
    if (chrome.storage) {
      this.type = 'chrome'
    } else if (window.localStorage) {
      this.type = 'locaStorage'
    } else {
      this.type = 'chrome'
    }
  }

  /**
   * 保存
   * @param {String} key
   * @param {Object} options
   */
  set(key, options) {
    if (this.type === 'chrome') {
      this._chromeSet(key, options)
    }

    if (this.type === 'locaStorage') {
      this._locaStorageSet(key, options)
    }
  }

  /**
   * 获取值
   * @param {String} key
   */
  get(key) {
    if (this.type === 'chrome') {
      this._chromeGet(key)
    }

    if (this.type === 'locaStorage') {
      this._locaStorageGet(key)
    }
  }

  /**
   * 删除
   * @param {String} key
   */
  delete(key) {
    if (this.type === 'chrome') {
      this._chromeDelete(key)
    }

    if (this.type === 'locaStorage') {
      this._locaStorageDelete(key)
    }
  }

  /**
   * chrome模式下的保存
   * @param {String} key
   * @param {Object} options
   */
  _chromeSet(key, options) {
    chrome.storage.sync.set({ key: options }, () => {})
  }

  /**
   * chrome模式下的获取值
   * @param {String} key
   */
  _chromeGet(key, options) {
    chrome.storage.sync.get([key], result => {})
  }

  /**
   * chrome模式下的删除
   * @param {String} key
   */
  _chromeDelete(key) {
    chrome.storage.sync.remove([key], result => {})
  }

  /**
   * locaStorage模式下的保存
   * @param {String} key
   * @param {Object} options
   */
  _locaStorageSet(key, options = '') {
    try {
      const _options = JSON.stringify(options)
      localStorage.setItem(key, _options)
    } catch (err) {}
  }

  /**
   * locaStorage模式下的获取值
   * @param {String} key
   */
  _locaStorageGet(key) {
    let _value = ''
    try {
      if (localStorage[key]) {
        _value = JSON.parse(localStorage.getItem(key))
      }

      return _value
    } catch (err) {}
  }

  /**
   * locaStorage模式下的删除
   * @param {String} key
   */
  _locaStorageDelete(key) {
    try {
      if (localStorage[key]) {
        localStorage.removeItem(key)
      }
    } catch (err) {}
  }
}
