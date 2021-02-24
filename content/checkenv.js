/**
 * 环境检测：
 * 1. 每次点击图标，展示popup.html时触发检测
 * 2. 在content-script.js中引入，监听popup.html发送的event-chenk-env事件
 * 3. 获取页面dom判断环境是否正确，并返回检测结果
 */
class CheckEnv {
  constructor() {
    this.status = 0 // 1: 环境检测成功，0:环境检测失败
  }

  check() {
    const result = [
      {
        iconType: "check"
      },
      {
        iconType: "check"
      }
    ]
    if (this.isValidUrl()) {
      console.log("url success")
      result[0].iconType = "success"
    }

    if (this.isLogin()) {
      console.log("login success")
      result[1].iconType = "success"
    }

    // if (this.isBasketballTab()) {
    //   result.push('success')
    // }

    return result
  }

  /**
   * 通过document.title包含bet365字段判断，是否进入365网址
   */
  isValidUrl() {
    return document.title.indexOf('bet365') >= 0
  }

  /**
   * 通过userAgent是否包含mobile字段判断是否是手机模式
   */
  isMobileMode() {
    const ua = navigator.userAgent.toLowerCase()
    return ua.indexOf('mobile') >= 0
  }

  /**
   * 根据页面上是否有“我的投注”标签判断是否已登录
   */
  isLogin() {
    return document.querySelector('.hm-HeaderMenuItemMyBets')
  }

  /**
   * 通过tab的文案是否等于篮球判断当前tab是否是篮球比赛
   */
  isBasketballTab() {
    const data = JSON.parse(localStorage.getItem("ns_weblib_util.StorageItems"));
    return data.currentPageClassification === '18'
  }
}
