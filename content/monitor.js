/**
 * 监听页面变化
 * 在content-script.js中引入
 * popup.html中手动触发监控开始
 *
 * 列表页监听：
 * 0: 10s中轮训一次
 * 1. 排除放弃的比赛
 * 2. 排除下注成功的比赛
 * 3. 筛选出第4节、下半场、加时比赛
 * 4. 筛选剩余时间在[60s, 120s]之间的比赛
 * 5. 比分差在9分以上的比赛
 * 6. 如果满足上述条件的比赛有多场次，选择剩余时间最少的一场进行跳转
 *
 * 详情页监听
 * 0: 1s中轮训一次
 * 1：请求下注接口
 */
class Monitor {
  constructor() {
    // 场次规则
    this.gameRules = ["第4节", "下半场", "加时"];

    // 时间规则(秒)：最后2分钟-最后1分钟时间段
    this.timeRules = [60, 100];

    // 分数规则：比分差不大于9分
    this.scoreRules = 9;

    // mock
    // this.gameRules = ["第1节", "第2节", "第3节", "第4节", "下半场", "加时"];
    // this.timeRules = [60, 500];
    // this.scoreRules = 20;
    
    // 满足条件的候选比赛
    this.alternativeGame = [];

    // 投注放弃的比赛和投注成功的比赛在列表页都要忽略
    this.ignoreGame = [];

    /**
     * 请求下注的球队数据
     *    BetOrderNo // 投注订单编号
     *    BetOdds    // 投注赔率
     *    BetTeam  // 下注球队
     *    BetMoney  // 下注金额
     * 
     */
    this.betRequestParams = {}

    // 在列表页停留的起始时间
    this.stayBeginTime = Date.now();  

    // 30分钟
    this.timeCycle = 1000 * 60 * 30;

    this.debugger = true;

    this.$ajax = new Api();

    this.isMonitorList = true;
    this.isMonitorDetail = false;

    this.TeamNameToOddsNode = {}

    this.canMinitorDetail = false

    // 选中的比赛的node
    this.selectedTeamNode = null

    // 点击盘口定时器
    // 如果点击盘口弹窗为弹出，间隔一定时间后再次点击；并在弹窗弹出后的回调中清除定时器
    this.timerOddsNode = null

    // 是否可以下注，默认不可以下注；接口返回可以下注后改为true
    // 在下注时通过判断球队是否在ignoreGame，判断是否已经投注成功。
    // 如果已经投注成功，则不在下注
    this.canSubmit = false
  }

  startMonitorList(){
    this.isMonitorList = true
  }

  stopMonitorList(){
    this.isMonitorList = false
  }

  startMonitorDetail(){
    this.isMonitorDetail = true
  }

  stopMonitorDetail(){
    this.isMonitorDetail = false
  }

  // 模拟touch事件
  click(ele){
    var rect = ele.getBoundingClientRect(); 
    var touch = new Touch({
        "identifier" : 0,
        "target" : ele,
        "clientX" : (rect.left + rect.right)/2,
        "clientY" : (rect.top + rect.bottom)/2,
        "screenX" : (rect.left + rect.right)/2,
        "screenY" : (rect.top + rect.bottom)/2,
        "pageX" : (rect.left + rect.right)/2,
        "pageY" : (rect.top + rect.bottom)/2,
        "radiusX" : 11.5,
        "radiusY" : 11.5,
        "rotationAngle" : 0.0,
        "force" : 1});
    
    var touchstart = new TouchEvent("touchstart", {
        cancelable: true,
        bubbles: true,
        composed: true,
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch]
    });
    
    var touchend = new TouchEvent("touchend", {
        cancelable: true,
        bubbles: true,
        composed: true,
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch]
    });
    
    ele.dispatchEvent(touchstart);
    ele.dispatchEvent(touchend);
  }

  /**
   * 列表页监控
   */
  list() {
    
    this.debugger && console.log("========================list begin========================:", this.isMonitorList);

    if(!this.isMonitorList) return;

    this.debugger && console.log("list ignoreGame:", this.ignoreGame);

    // 清空候选比赛
    this.alternativeGame = [];

    // 所有联赛
    let $allGames = $(".ovm-Competition");
    let _length = $allGames.length;
    let availableGames = [];

    /**
     * 筛选联赛
     * 剔除个人赛，比如NBA 02/21 - 勒布朗•詹姆斯 (洛杉矶湖人) 得分
     * 剔除电竞赛，比如篮球电竞球场现场赛
     */
    for (let i = 0; i < _length; i++) {
      let $games = $($allGames[i]);

      // 联赛名称，比如NBA
      const gameName = $games.find(".ovm-CompetitionHeader_Name").text();

      // 联赛名称中包含有“得分”、“电竞”字段的比赛
      if (gameName.indexOf("得分") >= 0 || gameName.indexOf("电竞") >= 0) {
        // delete $allGames[i];
      }else{
        availableGames.push($allGames[i])
      }
    }

    /**
     * 筛选符合条件的比赛
     */
    for (let i = 0; i < availableGames.length; i++) {
      let $games = $(availableGames[i]);

      // 联赛名称，比如NBA
      const game_name = $games.find(".ovm-CompetitionHeader_Name").text();

      // 比赛，比如湖人队 vs 公牛队
      const $allTeams = $games.find(".ovm-Fixture");

      for (let j = 0; j < $allTeams.length; j++) {
        const $game = $($allTeams[j]);

        // 球队名
        const $teanName = $game.find(".ovm-FixtureDetailsTwoWay_TeamName");
        const teamA = $teanName[0].innerText;
        const teamB = $teanName[1].innerText;

        // ignoreGame中不包含该场比赛
        if (this.ignoreGame.indexOf(teamA + teamB) === -1) {
          // 球队比分
          // const $teamScore = $game.find(".ipo-Fixture_PointField");
          const teamAScore = $game.find(".ovm-StandardScores_TeamOne").text();
          const teamBScore = $game.find(".ovm-StandardScores_TeamTwo").text();

          // 比赛剩余时间
          let gameTime = $game.find(".ovm-FixtureDetailsTwoWay_Timer").text();
          gameTime = this.formatTime(gameTime);

          /**
           * 比赛场次
           *
           * 加时比赛的文案是：加时 1 or 加时 2
           * 通过空格分割后取[0]元素
           */
          const gameScene = $game
            .find(".ovm-FixtureDetailsTwoWay_Period")
            .text()
            .split(" ")[0];

          // 是否符合投标条件
          const result = this.check(
            teamAScore,
            teamBScore,
            gameTime,
            gameScene
          );

          if (result) {
            this.alternativeGame.push($game);
          }
        }
      }
    }

    // 按照剩余时间升序排列
    this.alternativeGame.sort((pre, next) => {
      let preGameTime = pre.find(".ovm-FixtureDetailsTwoWay_Timer").text();
      preGameTime = this.formatTime(preGameTime);

      let nextGameTime = next.find(".ovm-FixtureDetailsTwoWay_Timer").text();
      nextGameTime = this.formatTime(nextGameTime);

      return preGameTime - nextGameTime;
    });

    this.debugger && console.log("alternativeGame:", this.alternativeGame);

    //取第一个元素点击进入
    if (this.alternativeGame.length) {
      this.selectedTeamNode = this.alternativeGame[0];
      const $teanName = this.selectedTeamNode.find(".ovm-FixtureDetailsTwoWay_TeamName");
      const selectedTeamAName = $teanName[0].innerText;
      const selectedTeamBName = $teanName[1].innerText;
      this.log(`数据监控，总共${this.alternativeGame.length}只猎物，进入[${selectedTeamAName} vs ${selectedTeamBName}]进行详细监控`)

      this.selectedTeamNode.find(".ovm-MediaIconContainer_Buttons").click()
      this.canMinitorDetail = true;
      // this.stopMonitorDetail()

    }else{
      this.log(`数据监控，无猎物`)
      this.reload()
    }
  }

  monitorSwitchGame(){
    // 监听比赛详情信息变化
    utils.domReady(".lsb-ScoreBasedScoreboard_Team1Container", (element) => {
      this.debugger && console.log("domReady: 切换比赛", element, this.canMinitorDetail);
      if(!$(".lv-ButtonBar").hasClass("Hidden")){
        document.querySelector(".lv-ButtonBar_MatchLiveIcon").click()
      }

      if(this.canMinitorDetail){
        this.stopMonitorList()
        this.startMonitorDetail()
      }
    })

    utils.domReady(".qbs-QuickBetHeader_BetReference", (element) => {
      this.debugger && console.log("domReady: 投注成功", element);
      this.betSuccess()

      element.ready = false;
    })

    utils.domReady(".qbs-AcceptButton_Text", (element) => {
      this.debugger && console.log("domReady: 投注赔率变化", element);
      // this.betResult(document.querySelector(".qbs-QuickBetHeader_MessageBody"))
      this.betOddsChange()

      element.ready = false;
    })

    utils.domReady(".qbs-NormalBetItem_Title", (element) => {
      this.debugger && console.log("domReady: 投注弹窗", element);
      clearInterval(this.timerOddsNode);
      this.confirmBetButton()

      element.ready = false;
    })

    // 刷新金额
    // utils.domReady(".um-BalanceRefreshButton_Icon", (element) => {
    //   this.debugger && console.log("domReady: 刷新金额", element);
    //   this.getUserName()
    //   this.refreshAmount(element)

    //   element.ready = false;
    // })
  }

  /**
   * 详情页监控
   */
  async detail() {
    
    this.debugger && console.log("========================detail begin========================:", this.isMonitorDetail);
    
    // 如果出现异常情况，导致isMonitorList、isMonitorDetail都为false时，强制重新监听detail
    // if(this.isMonitorDetail === false && this.isMonitorList === false){
    //   this.stopMonitorList()
    //   this.startMonitorDetail()
    // }

    if(!this.isMonitorDetail) return;
    
    const RemainingTime = $(".ml18-BasketballClock_Clock").text();

    // 详情页时间小于60s，返回列表页
    const _RemainingTime = this.formatTime(RemainingTime);
    if (_RemainingTime < this.timeRules[0]) {
      this.debugger && console.log("比赛剩余时间不够，结束详情页监控，返回列表页");
      this.betCompelete();
      return;
    }

    this.debugger && console.log("比赛剩余时间充足");

    const ATeamName = $(".lsb-ScoreBasedScoreboard_Team1Container").text();
    const BTeamName = $(".lsb-ScoreBasedScoreboard_Team2Container").text();
    const ATeamScore = $(".lsb-ScoreBasedScoreboard_TeamScore")[0] && $(".lsb-ScoreBasedScoreboard_TeamScore")[0].innerText;
    const BTeamScore = $(".lsb-ScoreBasedScoreboard_TeamScore")[1] && $(".lsb-ScoreBasedScoreboard_TeamScore")[1].innerText;

    const HasVideo = $(".ml18-BasketballCourt_SVG")[0] ? 1 : 0;

    this.debugger && console.log("获取球队名称，比分，是否有video");

    // 盘口获取赔率
    let ATeamOdds = '';
    let BTeamOdds = '';
    const ATeamOddsNode = this.selectedTeamNode.find(".ovm-ParticipantOddsOnly")[0]
    const BTeamOddsNode = this.selectedTeamNode.find(".ovm-ParticipantOddsOnly")[1]

    if(ATeamOddsNode){
      ATeamOdds = ATeamOddsNode.innerText;
      BTeamOdds = BTeamOddsNode.innerText;
    }

    // 如果赔率为空，表示“强弱盘赔率”盘口没有数据，结束本次监控
    if (ATeamOdds === '' && BTeamOdds === '') {
      this.debugger && console.log("未获取到盘口赔率", this.selectedTeamNode, ATeamOddsNode, BTeamOddsNode);
      return false;
    }

    this.debugger && console.log("获取盘口赔率");

    // 判断球权
    let BallTeam = "";
    let $allNodes = $(".ml18-AnimatedTextBar").children();
    let textArr = [];

    for (let i = 0; i < $allNodes.length; i++) {
      const $node = $($allNodes[i]);
      if (
        $node.css("display") !== "none" &&
        $node.css("opacity") !== "0" &&
        $node.text()
      ) {
        textArr.push($node.text());
      }
    }
    this.debugger && console.log(textArr);

    if (textArr[1] && textArr[1].indexOf("球权") >= 0) {
      BallTeam = textArr[0];
    }

    this.debugger && console.log("判断球权");

    // 罚球率
    const ATeamFt = $(".ml-DualStat_Percentage")[0] ? $(".ml-DualStat_Percentage")[0].innerText : "";
    const BTeamFt = $(".ml-DualStat_Percentage")[1] ? $(".ml-DualStat_Percentage")[1].innerText : "";

    this.debugger && console.log("获取发球率");

    const BallGroupName =  this.selectedTeamNode.parents(".ovm-Competition").find(".ovm-CompetitionHeader_Name").text() 

    this.debugger && console.log("获取联赛名称");

    const data = {
      BallGroupName: BallGroupName,
      ATeamName,
      BTeamName,
      ATeamScore,
      BTeamScore,
      ATeamOdds,
      BTeamOdds,
      RemainingTime,
      BallTeam,
      HasVideo,
      ATeamFt,
      BTeamFt
    };

    let winTeam = ATeamScore > BTeamScore ? ATeamName : BTeamName; // 赢球球队
    let winTeamOdds = ATeamScore > BTeamScore ? ATeamOdds : BTeamOdds; // 赢球球队赔率
    this.log(`[${ATeamName} vs ${BTeamName}] 剩余时间${RemainingTime}，${winTeam}赢${Math.abs(ATeamScore - BTeamScore)}分，${BallTeam}球权，赔率${winTeamOdds}，请求服务器确认是否下注`)

    if(!data.BallGroupName){
      this.debugger && console.log(`BallGroupName不能为空`)
    }else if(!data.ATeamName){
      this.debugger && console.log(`ATeamName不能为空`)
    }else if(!data.BTeamName){
      this.debugger && console.log(`BTeamName不能为空`)
    }else if(!data.ATeamScore){
      this.debugger && console.log(`ATeamScore不能为空`)
    }else if(!data.BTeamScore){
      this.debugger && console.log(`BTeamScore不能为空`)
    }else if(!data.ATeamOdds){
      this.debugger && console.log(`ATeamOdds不能为空`)
    }else if(!data.BTeamOdds){
      this.debugger && console.log(`BTeamOdds不能为空`)
    }else if(!data.RemainingTime){
      this.debugger && console.log(`RemainingTime不能为空`)
    }else if(!data.HasVideo){
      this.debugger && console.log(`HasVideo不能为空`)
    }else if(!data.ATeamFt){
      this.debugger && console.log(`ATeamFt不能为空`)
    }else if(!data.BTeamFt){
      this.debugger && console.log(`BTeamFt不能为空`)
    }else if(!data.BallTeam){
      this.debugger && console.log(`BallTeam不能为空`)
    }else{
      this.betRequestParams = data;

      data.AccountBalance = document.querySelector('.hm-MainHeaderMembersWide_Balance').innerText.slice(1).replaceAll(/,/g, "");

      chrome.runtime.sendMessage(
        {
          event: "event-bet-require",
          data: data
        },
        res => {
          this.debugger && console.log("betReqResult:",res);
          this.betReqResult(res);
        }
      );
    }
    
  }

  /**
   * 请求投注结果处理
   * @param {Object} res
   */
  betReqResult(res) {
    this.debugger && console.log("betReqResult");
    if (res.return_code === "0") {
      const { bet_status, bet_team, bet_money, bet_order_no } = res.return_data;
      if (bet_status === "1") {
        this.betRequestParams.BetOrderNo = bet_order_no;
        this.betRequestParams.BetTeam = bet_team;
        this.betRequestParams.BetMoney = bet_money;
        this.checkOddsClickable();

        this.stopMonitorDetail()

        this.canSubmit = true;

        this.log(`服务器回复下注，下注金额${bet_money}，立即投注`, true)
      } else if (bet_status === "3") {
        this.betGiveup();
        this.log("服务器回复放弃监控")
      } else if(bet_status === "2") {
        this.log("服务器回复继续监控")
      }else{

      }
    }
  }

  // 球队名称映射盘口节点
  mapTeamNameToOddsNode(node){

    // A对盘口节点
    const ATeamOddsNode = node.find(".ovm-ParticipantOddsOnly")[0]

    // B对盘口节点
    const BTeamOddsNode = node.find(".ovm-ParticipantOddsOnly")[1]

    // A对名称
    const ATeamName = node.find(".ovm-FixtureDetailsTwoWay_TeamName")[0].innerText;

    // B对名称
    const BTeamName = node.find(".ovm-FixtureDetailsTwoWay_TeamName")[1].innerText;

    const mapOpts = {}
    mapOpts[ATeamName] = ATeamOddsNode
    mapOpts[BTeamName] = BTeamOddsNode

    return mapOpts;
  }

  checkOddsClickable(){
    this.debugger && console.log("checkOddsClickable");
    const team = this.betRequestParams.BetTeam;
    const mapNameToOdds = this.mapTeamNameToOddsNode(this.selectedTeamNode);
    this.debugger && console.log(team, mapNameToOdds);
    // 盘口赔率
    const teamOdds = mapNameToOdds[team].innerText

    if(teamOdds === ""){
      this.debugger && console.log("未查询到下注盘口");
      // 不可以, 继续监控
      this.startMonitorDetail()
    }else{
      this.debugger && console.log("点击下注盘口:", mapNameToOdds, team);
      // 盘口点击
      mapNameToOdds[team].click();

      // 2s为弹出弹窗，再次点击
      // todo: 可能导致多次点击盘口，多次下注
      this.timerOddsNode = setTimeout(() => {
        this.debugger && console.log("未检测到投注弹窗，重新监听detail");
        clearTimeout(this.timerOddsNode);
        this.startMonitorDetail()
      }, 1000 * 10);
    }
  }

  // 是否时首次投注
  isFirstSubmit(){
    const gameName = this.betRequestParams.ATeamName + this.betRequestParams.BTeamName;
    return this.ignoreGame.indexOf(gameName) < 0;
  }

  // 点击投注
  confirmBetButton(){
    const isFirstSubmit = this.isFirstSubmit()
    this.debugger && console.log("canSubmit:", this.canSubmit, isFirstSubmit);
    if(this.canSubmit && isFirstSubmit) {
      this.debugger && console.log("confirmBetButton");
      $(".qbs-PlaceBetButton, .qbs-AcceptButton").click();
    }
  }

  // 赔率变化
  betOddsChange(){
    this.debugger && console.log("投注赔率变化");
    const statusText = $(".qbs-QuickBetHeader_MessageBody").text()

    this.debugger && console.log("statusText：", statusText);
    if(statusText && statusText !== "已投注"){
      // 取消投注
      $(".qbs-NormalBetItem_IndicationArea").click();

      // 继续监控
      this.startMonitorDetail()
    }
  }

  /**
   * 投注成功
   */
  betSuccess(){
    this.debugger && console.log("betSuccess");

    // 投注成功后
    this.canSubmit = false;

    this.reportOrder()

    $(".qbs-QuickBetHeader_DoneButton").click();

    this.betCompelete()

    // open
    this.clickMenu()
  }

  // 投注成功后上报数据
  reportOrder() {
    this.debugger && console.log("reportOrder");
    this.betRequestParams.ReturnMoney = $(".qbs-PlaceBetButton_ReturnValue").text().slice(1);
    this.betRequestParams.BetOdds = $(".bsc-OddsDropdownLabel").text()

    const data = {
      BetOrderNo: this.betRequestParams.BetOrderNo,
      BetOdds: this.betRequestParams.BetOdds,
      ReturnMoney:this.betRequestParams.ReturnMoney
    };

    chrome.runtime.sendMessage({
      event: "event-report-order",
      data: data
    });

    this.log(`[${this.betRequestParams.ATeamName} vs ${this.betRequestParams.BTeamName}]投注${this.betRequestParams.BetTeam}独赢${this.betRequestParams.BetMoney}，投注成功，赔率${this.betRequestParams.BetOdds}`, true)
  }

  /**
   * 放弃投注
   */
  betGiveup() {
    this.debugger && console.log("betGiveup");
    this.betCompelete();
  }

  /**
   * 投注完成：
   */
  betCompelete() {
    this.debugger && console.log("betCompelete");
    this.updateIgnoreGame();
    this.stayBeginTime = Date.now()

    this.startMonitorList()
    this.stopMonitorDetail()
  }

  /**
   * 格式化时间，将9:48转化成秒
   * 9:48 --> 9 * 60 + 48 = 588
   * @param {String} time  比赛时间  eg:9:48
   */
  formatTime(time) {
    const timeArr = time.split(":");
    return Number(timeArr[0]) * 60 + Number(timeArr[1]);
  }

  /**
   * 检测比赛是否符合条件
   * @param {*} teamAScore  球队A比赛分数
   * @param {*} teamBScore  球队B比赛分数
   * @param {*} time        比赛剩余时间
   * @param {*} gameScene   比赛场次
   */
  check(teamAScore, teamBScore, time, gameScene) {
    const resultScene = this.gameRules.indexOf(gameScene) >= 0;
    const resultScore =
      Math.abs(Number(teamAScore) - Number(teamBScore)) <= this.scoreRules;

    const resultTime = time >= this.timeRules[0] && time <= this.timeRules[1];

    return resultScene && resultScore && resultTime;
  }

  /**
   * 更新忽略比赛数组
   */
  updateIgnoreGame() {
    this.debugger && console.log("updateIgnoreGame");
    const _text = this.betRequestParams.ATeamName + this.betRequestParams.BTeamName;

    if (_text) {
      this.ignoreGame.push(_text);
    }
  }

  clickMenu(){
    this.debugger && console.log("clickMenu");
    let $wraperNode = document.querySelector('.hm-MainHeaderMembersWide_MembersMenuIcon');
    // open
    $wraperNode.click();
  }

  // 刷新剩余金额
  refreshAmount(element) {
    this.debugger && console.log("refreshAmount");

    // 刷新按钮
    element.click();

    // 等待刷新金额
    this.sleep(1000);

    // 再次点击关闭menu
    this.clickMenu()

    const amount = document.querySelector('.hm-MainHeaderMembersWide_Balance').innerText

    chrome.runtime.sendMessage({
      event: "event-refresh-amount",
      data:{
        amount: amount
      }
    });
  }

  getUserName(){
    this.debugger && console.log("getUserName inner")

    const username = $(".um-UserInfo_UserName").text()
    chrome.runtime.sendMessage(
      {
        event: "event-get-username",
        data: {
          username: username
        }
      }
    );
  }

  sleep(time = 1000) {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  addZero(number){
      let _result = number;
      if(number < 10){
        _result = "0" + number
      }
      return _result;
  }

  log(text, color = false){
    // if(!this.debugger) return;
    const dateStr = new Date();
    const year = dateStr.getFullYear()
    const month = this.addZero(dateStr.getMonth() + 1)
    const day = this.addZero(dateStr.getDate())
    const hour = this.addZero(dateStr.getHours())
    const minute = this.addZero(dateStr.getMinutes())
    const second = this.addZero(dateStr.getSeconds())
    const _text = `${year}-${month}-${day} ${hour}:${minute}:${second} ${text}`

    if(color){
      console.log(`%c${_text}`, "color:red")
    }else{
      console.log(_text)
    }
  }

  // 如果在列表页停留超过30分钟以上，重新加载页面并切换到篮球tab
  async reload(){
    this.debugger && console.log("列表页停留时长：", Date.now() - this.stayBeginTime, this.timeCycle)
    if(Date.now() - this.stayBeginTime > this.timeCycle) {

      if(location.hash === '#/IP/B18'){
        window.location.reload()
      }else{
        window.location.hash="/IP/B18"
      }

      this.startMonitorList()
      this.stopMonitorDetail()
    };
  }

  getTabByName(name){
    const $tabs = $(".ovm-ClassificationBarButton")
    const length = $tabs.length;
    let selectTab;

    for(let i = 0; i < length; i++){
      if($($tabs[i]).text() === name){
        selectTab = $tabs[i]
      }
    }

    return selectTab
  }
}


