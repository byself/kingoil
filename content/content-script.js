const Bet = {
  // $store: new Store(),
  $utils: utils,
  $monitor: new Monitor(),
  $checkenv: new CheckEnv(),
  $uploadmatchdata: new UploadMatchData(),
  debugger: true
}

// 切换tab，停止监听
window.addEventListener("hashchange", function(){
  console.log("==============hashchange================")
  if(location.hash === "#/IP/B18"){
    Bet.$monitor.startMonitorList()
    Bet.$monitor.stopMonitorDetail()
  }else{
    Bet.$monitor.stopMonitorList()
    Bet.$monitor.stopMonitorDetail()
  }
});

// 注意，必须设置了run_at=document_start 此段代码才会生效
document.addEventListener('DOMContentLoaded', function() {
  log('DOMContentLoaded')
  Bet.$monitor.monitorSwitchGame()
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
  console.log("getUserName outer")
  let $wraperNode = document.querySelector('.hm-MainHeaderMembersWide_MembersMenuIcon');
  // Bet.$utils.domReady(".um-UserInfo_UserName", (element) => {
  //   console.log("getUserName inner")
  //   chrome.runtime.sendMessage(
  //     {
  //       event: "event-get-username",
  //       data: {
  //         username: element.innerText
  //       }
  //     }
  //   );

  //   element.ready = false;

  //   // close menu
  //   $wraperNode.click();
  // })

  // show menu
  $wraperNode.click();
}

function jumpBasketball(){
  log('jumpBasketball')
  window.location.hash = "/IP/B18"
}

function log(){
  Bet.debugger && console.log.apply(this, arguments);
}