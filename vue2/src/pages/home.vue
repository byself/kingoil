<template>
  <div class="result-home">
    <div class="time">
      运营时间：<span>{{runTime}}</span>
    </div>
    <div class="line"></div>
    <div class="items">
      <div class="item">
        <div class="content">{{gainPercentage}}</div>
        <div class="label">盈利比例</div>
      </div>
      <div class="item">
        <div class="content">{{averageOdds}}</div>
        <div class="label">均赔</div>
      </div>
    </div>
    <div class="line"></div>
    <div class="items">
      <div class="item">
        <div class="content">{{oilBall}}</div>
        <div class="label">出油比赛</div>
      </div>
      <div class="item">
        <div class="content">{{betBall}}</div>
        <div class="label">投注成功</div>
      </div>
      <div class="item">
        <div class="content">{{winBall}}</div>
        <div class="label">赢球数</div>
      </div>
    </div>

    <div class="tips">注：此处数据存在延迟，精确数据请后台查看</div>

    <mm-button
      type="primary"
      @click="getRunData"
    >汇总数据刷新</mm-button>
  </div>
</template>

<script>
export default {
  name: "page-result-home",
  data() {
    return {
      runTime: "",
      startAmount: "1234",
      gainAmount: "",
      oilBall: "",
      betBall: "",
      winBall: "",
      gainPercentage:"",
      averageOdds:""
    };
  },

  created() {
    this.getRunData();
  },
  methods: {
    async getRunData() {
      const $background = chrome.extension.getBackgroundPage();
      const {
        return_code,
        return_msg,
        return_data
      } = await $background.getRunData();

      if (return_code === "0") {
        this.runTime = return_data.run_time;
        this.startAmount = return_data.start_money;
        this.gainAmount = return_data.gain_money;
        this.gainPercentage = return_data.gain_percentage;
        this.averageOdds = return_data.average_odds;
        this.oilBall = return_data.oil_ball;
        this.betBall = return_data.bet_ball;
        this.winBall = return_data.win_ball;
      } else {
        alert(return_msg);
      }
    }
  }
};
</script>

<style lang="scss">
.result-home {
  margin-top: 60px;
  padding: 0 40px;
  font-size: 26px;

  .time {
    padding: 40px 0;

    span {
      color: #d30519;
    }
  }

  .line {
    width: 100%;
    border-top: 1px dashed #ddd;
  }

  .items {
    display: flex;
    padding: 60px 0;

    .item {
      flex: 1;
      text-align: center;

      .content {
        font-size: 52px;
        color: #d30519;
        height: 64px;
      }

      .label {
        margin-top: 20px;
      }
    }
  }

  .tips {
    margin: 60px 0 40px;
  }
}
</style>