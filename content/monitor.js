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
 * 5. 比分差在8分以上的比赛
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

    // 分数规则：比分差不大于8分
    this.scoreRules = 8;

    // mock
    // this.gameRules = ["第2节", "第3节", "第4节", "下半场", "加时"];
    // this.timeRules = [30, 600];
    // this.scoreRules = 10;
    
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

    this.debugger = false;

    this.$ajax = new Api();

    this.gameInfo = {
      groupName: ""
    };
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
    this.debugger && console.log("========================list begin========================");
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
      const $teanName = this.alternativeGame[0].find(".ovm-FixtureDetailsTwoWay_TeamName");
      const selectedTeamAName = $teanName[0].innerText;
      const selectedTeamBName = $teanName[1].innerText;
      this.log(`数据监控，总共${this.alternativeGame.length}只猎物，进入[${selectedTeamAName} vs ${selectedTeamBName}]进行详细监控`)

      this.gameInfo.groupName = this.alternativeGame[0].parents(".ovm-Competition").find(".ovm-CompetitionHeader_Name").text()

      this.click(this.alternativeGame[0].find(".ovm-FixtureDetailsTwoWay")[0])
    }else{
      this.log(`数据监控，无猎物`)
      this.reload()
    }
  }

  /**
   * 详情页监控
   */
  async detail() {
    this.debugger && console.log("========================detail begin========================");
    const RemainingTime = $(".ml18-BasketballClock_Clock").text();

    // 详情页时间小于60s，返回列表页
    const _RemainingTime = this.formatTime(RemainingTime);
    if (_RemainingTime < this.timeRules[0]) {
      this.debugger && console.log("比赛剩余时间不够，结束详情页监控，返回列表页");
      this.betCompelete();
      return;
    }
    // todo: 球队名称获取
    // let $nodeBallGroupName = $(".ipe-EventSwitcherFixture_CurrentFixture").prev()[0];
    // const BallGroupName = $nodeBallGroupName ? $nodeBallGroupName.innerText : "";
    $(".ipe-MatchButton").click();
    
    // const BallGroupName = this.gameInfo.groupName;
    const BallGroupName = $(".ipn-Fixture.ipn-Fixture-selected").parents(".ipn-Competition").find(".ipn-CompetitionButton_Text").text();
    $(".g5-PopupManager_ClickMask").click();
    const ATeamName = $(".lsb-ScoreBasedScoreboard_Team1Container").text();
    const BTeamName = $(".lsb-ScoreBasedScoreboard_Team2Container").text();
    const ATeamScore = $(".lsb-ScoreBasedScoreboard_TeamScore")[0] && $(".lsb-ScoreBasedScoreboard_TeamScore")[0].innerText;
    const BTeamScore = $(".lsb-ScoreBasedScoreboard_TeamScore")[1] && $(".lsb-ScoreBasedScoreboard_TeamScore")[1].innerText;

    const HasVideo = $(".ml18-BasketballCourt_SVG")[0] ? 1 : 0;

    // 盘口获取赔率
    const $ipeMarkets = $(".sip-MarketGroup");
    let ATeamOdds = 0;
    let BTeamOdds = 0;
    for (let i = 0; i < $ipeMarkets.length; i++) {
      const $market = $($ipeMarkets[i]);
      const text = $market.find(".sip-MarketGroupButton_Text").text();
      const type = $market.find(".srb-ParticipantLabel_Name").text();

      const $lastCol = $market.find(".gl-Market_General-lastinrow");
      const $firstCol = $lastCol.prev();
      

      if (text === "比赛投注" && type.indexOf("强弱盘赔率") >= 0) {
        ATeamOdds = $firstCol.find(".srb-ParticipantCenteredStackedMarketRow_Odds").last().text();
        BTeamOdds = $lastCol.find(".srb-ParticipantCenteredStackedMarketRow_Odds").last().text();
      }
    }

    // 如果赔率为0，表示没有“比赛获胜”的盘口，结束本次监控
    if (ATeamOdds === 0 && BTeamOdds === 0) {
      return;
    }

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

    // 罚球率
    const ATeamFt = $(".ml-DualStat_Percentage")[0] ? $(".ml-DualStat_Percentage")[0].innerText : "";
    const BTeamFt = $(".ml-DualStat_Percentage")[1] ? $(".ml-DualStat_Percentage")[1].innerText : "";

    const data = {
      BallGroupName,
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

      chrome.runtime.sendMessage(
        {
          event: "event-bet-require",
          data: data
        },
        res => {
          this.betReqResult(res);
          this.debugger && console.log(res);
        }
      );
    }
    
  }

  /**
   * 请求投注结果处理
   * @param {Object} res
   */
  betReqResult(res) {
    if (res.return_code === "0") {
      const { bet_status, bet_team, bet_money, bet_order_no } = res.return_data;
      if (bet_status === "1") {
        this.betRequestParams.BetOrderNo = bet_order_no;
        this.betRequestParams.BetTeam = bet_team;
        this.betRequestParams.BetMoney = bet_money;
        this.betNow();

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

  /**
   * 立即下注
   */
  async betNow() {
    try{
      const team = this.betRequestParams.BetTeam;
      const money = this.betRequestParams.BetMoney;

      let $ipeMarkets = $(".sip-MarketGroup");
      let $node = null; // 下注球队的节点

      this.debugger && console.log("length:", $ipeMarkets.length);
      for (let i = 0; i < $ipeMarkets.length; i++) {
        const $market = $($ipeMarkets[i]);
        const text = $market.find(".sip-MarketGroupButton_Text").text();
        const type = $market.find(".srb-ParticipantLabel_Name").text();

        const $lastCol = $market.find(".gl-Market_General-lastinrow");
        const $firstCol = $lastCol.prev();

        // const $ipeOddName = $market.find(".ipe-Participant_OppName");

        if (text === "比赛投注" && type.indexOf("强弱盘赔率") >= 0) {
          this.debugger && console.log("获取到[比赛获胜]盘口");
          if ($firstCol.find(".gl-MarketColumnHeader").text() === team) {
            $node = $firstCol.find(".srb-ParticipantCenteredStackedMarketRow").last();
          }

          if ($lastCol.find(".gl-MarketColumnHeader").text() === team) {
            $node = $lastCol.find(".srb-ParticipantCenteredStackedMarketRow").last();
          }

          this.debugger && console.log("text:", text);
          this.debugger && console.log("text0:", $firstCol.find(".gl-MarketColumnHeader").text());
          this.debugger && console.log("text1:", $lastCol.find(".gl-MarketColumnHeader").text());
        }
      }

      await this.sleep(800);

      // 盘口是否可以点击下注
      this.debugger && console.log(
        "盘口是否可以点击:",
        $node === null || $($node).hasClass("srb-ParticipantCenteredStackedMarketRow_Suspended"),
        $($node).attr("class")
      );
      if ($node === null || $($node).hasClass("srb-ParticipantCenteredStackedMarketRow_Suspended")) {
        this.debugger && console.log("未查询到下注盘口");
        // 不可以, 继续监控
        this.remonitor()
        return;
      } else {
        // 可以
        this.debugger && console.log("点击下注盘口:", $node);
        $($node).click();

        // this.betRequestParams.BetOdds = $($node).find(".ipe-Participant_OppOdds").text()
      }

      await this.sleep(800);

      // 下注弹层未展示，重新调用
      if(!$(".bsm-BetslipStandardModule").hasClass("bsm-BetslipStandardModule_QuickBetExpanded")){
        this.debugger && console.log("投注弹层未展示，继续点击盘口", $(".bsm-BetslipStandardModule"))
        this.betNow()
        return;
      }

      // 设置金额
      this.debugger && console.log("设置金额:", money);
      this.debugger && console.log("弹出数字键盘")
      $(".qbs-StakeBox_StakeInput").click()

      // await this.sleep(800);

      const moneyArr = money.split("");
      this.debugger && console.log("金额拆分数组:", moneyArr)
      for(let i = 0; i < moneyArr.length; i++){
        let index = moneyArr[i]-1;
        // 如果是数字0，需要定位到第10的位置
        if(index === -1){
          index = 9
        }
        this.debugger && console.log("按键:", index)
        $(".qbs-NumberButton")[index].click()
      }

      // await this.sleep(800);

      this.debugger && console.log("确认下注");

      $(".qbs-PlaceBetButton, .qbs-AcceptButton").click();

      // 是否在提交处理中
      let count = 1;
      let timer = setInterval(async () => {
        this.debugger && console.log("count:", count);
        if (count <= 10) {
          const btnText = $(".qbs-QuickBetHeader_MessageBody").text();
          const btnText2 = $(".qbs-AcceptButton_PlaceBet").text();
          this.debugger && console.log("btnText:", btnText);
          this.debugger && console.log("btnText2:", btnText2);
          if (btnText === "已投注") {
            // 投注成功
            clearInterval(timer);
            
            // 投注成功，上报接口
            this.betRequestParams.ReturnMoney = $(".qbs-PlaceBetButton_ReturnValue").text().slice(1);
            this.betRequestParams.BetOdds = $(".bsc-OddsDropdownLabel").text()
            this.betSuccess();

            await this.sleep(800);

            // 点击完成，收起弹层，否则返回列表页时依然展示
            $(".qbs-QuickBetHeader_DoneButton").click();

            // 刷新剩余金额
            this.refreshAmount()

            setTimeout(()=>{
              this.remonitor()
              this.betCompelete()
            }, 1000);
          } else if (btnText === "投注项已无效") {
            // 设置count >= 10, 下次循环走else逻辑
            count = 10;
          } else if (btnText === "您所选投注项的赔率已经产生变化" && btnText2 === "投注") {
            // 继续投注需要检测比赛时间是否满足条件，详情页时间小于60s，返回列表页
            const RemainingTime = $(".ml18-ScoreHeaderBasketball_Clock").text();
            const _RemainingTime = this.formatTime(RemainingTime);
            if (_RemainingTime < this.timeRules[0]) {
              clearInterval(timer);
              this.betCompelete();
            } else {
              // await this.sleep(800);
              // $(".qbs-AcceptButton").click();
              // count = 0;

              count = 10; // 设置count >= 10, 下次循环走else逻辑
            }
          }else {
          }

          count++;
        } else {
          this.debugger && console.log("取消投注");
          clearInterval(timer);

          // 取消投注
          $(".qbs-NormalBetItem_IndicationArea").click();

          // 继续监控
          this.remonitor()
        }
      }, 1000);
    }catch(err){
      this.debugger && console.log("betNow:", err);
      this.betNow()
    }
  }

  betSuccess() {
    const data = {
      BetOrderNo: this.betRequestParams.BetOrderNo,
      BetOdds: this.betRequestParams.BetOdds,
      ReturnMoney:this.betRequestParams.ReturnMoney
    };

    chrome.runtime.sendMessage({
      event: "event-bet-success",
      data: data
    });

    this.log(`[${this.betRequestParams.ATeamName} vs ${this.betRequestParams.BTeamName}]投注${this.betRequestParams.BetTeam}独赢${this.betRequestParams.BetMoney}，投注成功，赔率${this.betRequestParams.BetOdds}`, true)
  }

  /**
   * 放弃投注
   */
  betGiveup() {
    this.betCompelete();
  }

  /**
   * 投注完成：
   */
  betCompelete() {
    this.updateIgnoreGame();
    this.stayBeginTime = Date.now()

    window.history.back();
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

    const _text = this.betRequestParams.ATeamName + this.betRequestParams.BTeamName;

    if (_text) {
      this.ignoreGame.push(_text);
    }
  }

  // 重新监控
  remonitor() {
    chrome.runtime.sendMessage({
      event: "event-remonitor"
    });
  }

  // 刷新剩余金额
  refreshAmount() {

    let $wraperNode = document.querySelector('.hm-MainHeaderMembersNarrow');

    // open
    $wraperNode.click();

    this.sleep(200);

    // 刷新按钮
    $(".um-BalanceRefreshButton").click();

    this.sleep(200);

    const amount = document.querySelector('.hm-MainHeaderMembersNarrow_Balance')
    .innerText

    // close
    $wraperNode.click();

    chrome.runtime.sendMessage({
      event: "event-refresh-amount",
      data:{
        amount: amount
      }
    });
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
      window.location.reload()
      window.location.hash="/IP/B18"
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


