const Bet = {
  // $store: new Store(),
  $utils: utils,
  $monitor: new Monitor(),
  $checkenv: new CheckEnv(),
  $uploadmatchdata: new UploadMatchData(),
  debugger: false,
  userNameObserver: null
}

// 切换tab，停止监听
window.addEventListener("hashchange", function(){
  log("==============hashchange================:", location.hash)
  if(location.hash === "#/IP/B18"){
    log("篮球tab,监听list,停止detail")
    Bet.$monitor.startMonitorList()
    Bet.$monitor.stopMonitorDetail()
  }else{
    log("非篮球tab")
    Bet.$monitor.stopMonitorList()
    Bet.$monitor.stopMonitorDetail()
  }
});

// 注意，必须设置了run_at=document_start 此段代码才会生效
document.addEventListener('DOMContentLoaded', function() {
  log('DOMContentLoaded')

  monitorUserName();

  chrome.runtime.onMessage.addListener(messageHandler)
  // Bet.$monitor.monitorSwitchGame()
  // 每隔60分钟跳转至篮球
  // 解决问题：篮球从无到有时无法自动切换的问题
  setInterval(function(){
    log('切换至篮球')
    jumpBasketball()
  }, 60 * 60 * 1000)
})

function messageHandler(request, sender, sendResponse) {
  // log('messageHandler:', request.event)
  try{
    switch (request.event) {
      case 'event-begin-monitor':
        beginMonitor()
        break
      case 'event-begin-list-monitor':
        Bet.$monitor.list()
        break
      case 'event-begin-detail-monitor':
        Bet.$monitor.detail()
        break
      case 'event-check-env':
        checkEnvHandler(request, sender, sendResponse)
        break
      case 'event-get-amount':
        getAmount(request, sender, sendResponse)
        break
      case 'event-upload-match-data':
        uploadmatchData(request, sender, sendResponse)
        break
      case 'event-query-username':
        getUserName(request, sender, sendResponse)
        break
    }
  }catch(e){
    window.location.reload()
  }
}

function beginMonitor(){
  Bet.$monitor.monitorSwitchGame()
}

/**
 * 比赛数据上传
 * @param {*} request
 * @param {*} sender
 * @param {*} sendResponse
 */
function uploadmatchData(request, sender, sendResponse) {
  const result = Bet.$uploadmatchdata.init()
  sendResponse(result)
}

/**
 * 环境检测
 * @param {} request
 * @param {*} sender
 * @param {*} sendResponse
 */
function checkEnvHandler(request, sender, sendResponse) {
  const result = Bet.$checkenv.check()

  if(result.length === 2){
    jumpBasketball()
  }

  log('content checkEnvHandler:', result)
  sendResponse(result)
}

/**
 * 获取金额
 * @param {*} request
 * @param {*} sender
 * @param {*} sendResponse
 */
function getAmount(request, sender, sendResponse) {
  const amount = document.querySelector('.hm-MainHeaderMembersWide_Balance')
    .innerText
  sendResponse(amount)
}

/**
 * 获取用户名
 * @param {*} request
 * @param {*} sender
 * @param {*} sendResponse
 */
async function getUserName(request, sender, sendResponse){
  log("getUserName outer")
  // show menu
  clickMenu()
}

function clickMenu(){
  let $wraperNode = document.querySelector('.hm-MainHeaderMembersWide_MembersMenuIcon');
  // show menu
  $wraperNode.click();
}

function monitorUserName(){
  log("monitorUserName")
  Bet.userNameObserver = new MutationObserver(sendUserName);
  Bet.userNameObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  function sendUserName(){
    log("sendUserName")

    const node = document.querySelector(".um-UserInfo_UserName");

    if(node){
      log("username node show:", node)
      const username = $(".um-UserInfo_UserName").text()
      chrome.runtime.sendMessage(
        {
          event: "event-get-username",
          data: {
            username: username
          }
        }
      );
      Bet.userNameObserver.disconnect()

      //hide menu 
      clickMenu()
    }
  }
}

function jumpBasketball(){
  log('jumpBasketball')
  window.location.hash = "/IP/B18"
}

function log(){
  Bet.debugger && console.log.apply(this, arguments);
}