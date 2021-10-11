const Bet = {
  // $store: new Store(),
  $monitor: new Monitor(),
  $checkenv: new CheckEnv(),
  $uploadmatchdata: new UploadMatchData(),
  debugger: false
}

// 注意，必须设置了run_at=document_start 此段代码才会生效
document.addEventListener('DOMContentLoaded', function() {
  log('DOMContentLoaded')
  chrome.runtime.onMessage.addListener(messageHandler)

  // 每隔60分钟跳转至篮球
  // 解决问题：篮球从无到有时无法自动切换的问题
  setInterval(function(){
    log('切换至篮球')
    jumpBasketball()
  }, 60 * 60 * 1000)
})

function messageHandler(request, sender, sendResponse) {
  log('messageHandler:', request.event)
  try{
    switch (request.event) {
      case 'event-begin-list-monitor':
        beginListMonitorHandler(request, sender, sendResponse)
        break
      case 'event-begin-detail-monitor':
        beginDetailMonitorHandler(request, sender, sendResponse)
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
  const amount = document.querySelector('.hm-MainHeaderMembersNarrow_Balance')
    .innerText
  sendResponse(amount)
}

/**
 * 获取用户名
 * @param {*} request
 * @param {*} sender
 * @param {*} sendResponse
 */
function getUserName(request, sender, sendResponse) {
  let $wraperNode = document.querySelector('.hm-MainHeaderMembersNarrow');
  $wraperNode.click();
  let hasGetName = false;

  let timer = setInterval(() => {
    let $nameNode = document.querySelector('.um-UserInfo_UserName'); 

    if(hasGetName){
      if($nameNode){
        $wraperNode.click();
      }else{
        clearInterval(timer);
      }
    }else{
      if($nameNode){
        let username = $nameNode.innerText;
        log("getUserName", username)
        if(username){
          chrome.runtime.sendMessage(
            {
              event: "event-get-username",
              data: {
                username: username
              }
            }
          );
          $wraperNode.click();
          hasGetName = true;
          // 
        }
      }
    }
    
  }, 100)
}

/**
 * 列表页监控
 */
function beginListMonitorHandler() {
  // 当前页面是篮球列表页
  if (window.location.hash.indexOf('#/IP/B18') === 0) {
    Bet.$monitor.list()
  }
}

/**
 * 详情页监控
 */
function beginDetailMonitorHandler() {
  if (window.location.hash.indexOf('#/IP/E') === 0) {
    Bet.$monitor.detail()
  }
}

function jumpBasketball(){
  window.location.hash = "/IP/B18"
}

function log(){
  Bet.debugger && console.log.apply(this, arguments);
}