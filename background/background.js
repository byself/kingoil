const Bet = {
  $utils: utils,
  $ajax: new Api()
}

const CommonOps = {
  uid: '', // 用户id，每个接口都需要此参数
  planId: '', // 投标id
  username: '', // 用户名
  amount: '', // 账户金额

  debugger: true,

  // 投注成功上报参数
  betRequestParams:{},

  // 登陆返回值
  loginStatus:{}
}

// 运营日志
const Logs = []

/**
 * 忽略的比赛，保存6小时
 * 1: 下注成功的比赛
 * 2: 被放弃的比赛
 */
const ignoreGames = [
  {
    BallGroup: 1, // 联赛名称
    ATeamName: 2, // 球队A
    BTeamName: 3 // 球队B
  }
]

/**
 * 比赛数据上报
 */
async function uploadMatchData() {
  const activeTabId = await Bet.$utils.getCurrentTabId()
  const teams = await new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      activeTabId,
      { event: 'event-upload-match-data' },
      function(res) {
        resolve(res)
      }
    )
  })

  for (let i = 0; i < teams.length; i++) {
    let { BallGroup, ATeamName, BTeamName } = teams[i]
    Bet.$ajax.get({
      url: '/MatchDataReq.aspx',
      data: {
        BallGroup,
        ATeamName,
        BTeamName
      }
    })
  }
}

/**
 * 检测环境
 */
async function checkEnv() {
  queryUserName()
  const activeTabId = await Bet.$utils.getCurrentTabId()
  const result = await new Promise((resolve, reject) => {
    console.log('background checkEnv activeTabId:', activeTabId)
    chrome.tabs.sendMessage(activeTabId, { event: 'event-check-env' }, function(
      res
    ) {
      console.log('background checkEnv sendMessage:', res)
      resolve(res)
    })
  })

  CommonOps.debugger && console.log('background checkEnv:', result)

  return result
}

function autoLogin(){
    return CommonOps.loginStatus;
}

/**
 * 登录插件
 */
async function login() {
  CommonOps.debugger && console.log('background login', CommonOps.username)
  const res = await Bet.$ajax.get({
    url: '/LoginExt.aspx',
    data: {
      UserName: CommonOps.username,
    }
  })

  const _res = JSON.parse(res)

  if (_res.return_code === '0') {
    CommonOps.uid = _res.uid
    CommonOps.loginStatus.iconType = "success"
    CommonOps.loginStatus.error = ''
  }else{
    CommonOps.loginStatus.iconType = "check"
    CommonOps.loginStatus.error = _res._res
  }
}

/**
 * 获取投标方案
 */
async function getBetPlan() {
  CommonOps.debugger && console.log('background getBetPlan')
  const res = await Bet.$ajax.get({
    url: '/GetBetPlan.aspx',
    data: {
      uid: CommonOps.uid
    }
  })

  const _res = JSON.parse(res)

  CommonOps.planId = _res.return_data[0].bet_plan_id

  return _res
}

/**
 * 从页面上获取账户金额
 */
async function getAmount() {
  const activeTabId = await Bet.$utils.getCurrentTabId()
  const result = await new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      activeTabId,
      { event: 'event-get-amount' },
      function(res) {
        resolve(res)
      }
    )
  })
  CommonOps.amount = result
  return result
}

/**
 * 从页面上获取用户名
 */
async function queryUserName() {
  const activeTabId = await Bet.$utils.getCurrentTabId()
  chrome.tabs.sendMessage(
    activeTabId,
    { event: 'event-query-username' }
  )
}

function getUserName(res) {
  CommonOps.debugger && console.log('getUserName', res);
  if(res.data.username){
    CommonOps.username = res.data.username;
    login()
  }
}

/**
 * 获取所有缓存数据
 */
async function getCommonOps() {
  CommonOps.debugger && console.log(CommonOps)
  const amount = await getAmount()
  CommonOps.amount = amount
  return CommonOps
}

/**
 * 获取运营数据
 */
async function getRunData() {
  CommonOps.debugger && console.log('background getRunData')
  const res = await Bet.$ajax.get({
    url: '/GetRunData.aspx',
    data: {
      uid: CommonOps.uid
    }
  })

  const _res = JSON.parse(res)

  CommonOps.debugger && console.log(_res)

  return _res
}

/**
 * 上报“投注成功”数据
 */
async function betSuccessReq(request) {
  CommonOps.debugger && console.log('background betSuccessReq:', request.data || CommonOps.betRequestParams)

  if (CommonOps.betRequestParams.BetOrderNo !== request.data.BetOrderNo) {
    CommonOps.betRequestParams = request.data
  }

  const res = await Bet.$ajax.get({
    url: '/BetSuccessReq.aspx',
    data: {
      uid: CommonOps.uid,
      ...CommonOps.betRequestParams
    }
  })

  const _res = JSON.parse(res)

  // 上报失败重新上报
  if (_res.return_code !== '0') {
    betSuccessReq()
  }

  return _res
}

/**
 * 存储plan_id
 */
function savePlanId(id) {
  CommonOps.planId = id
}

/**
 * 监控开始
 */
async function beginMonitor() {
  const activeTabId = await Bet.$utils.getCurrentTabId()
  chrome.tabs.sendMessage(activeTabId, { event: 'event-begin-monitor' })
}

/**
 * 接收监听事件
 */
chrome.runtime.onMessage.addListener(messageHandler)

function messageHandler(request, sender, sendResponse) {
  CommonOps.debugger && console.log('messageHandler request:', request)
  CommonOps.debugger && console.log('messageHandler sender:', sender)
  switch (request.event) {
    case 'event-bet-require':
      queryBetStatus(request, sender, sendResponse)
      break
    case 'event-bet-success':
      betSuccessReq(request)
      break
    case 'event-get-username':
        getUserName(request)
        break
  }

  return true
}

/**
 * 请求投标方案
 */
async function queryBetStatus(request, sender, sendResponse) {
  
  if(!CommonOps.username){
    queryUserName()
  }

  // 获取最新剩余额度
  getAmount()
  const data = {
    UID: CommonOps.uid,
    BetPlanID: CommonOps.planId,
    ...request.data,
    Account:  CommonOps.username,
    AccountBalance: CommonOps.amount.slice(1).replaceAll(/,/g, "")
  }
  const res = await Bet.$ajax.get({
    url: '/BetReq.aspx',
    data: data
  })

  let _res;

  try{
    _res = JSON.parse(res);
  }catch(err){
    _res = res
  }

  CommonOps.debugger && console.log('background queryBetStatus:', _res)

  sendResponse(_res)
}
