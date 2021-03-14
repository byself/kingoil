<template>
  <div class="check-env">
    <div class="header">
      插件环境检测
    </div>

    <div class="title">
      <md-icon
        name="home"
        size="md"
        color="#ff5257"
      ></md-icon> 检测结果
    </div>

    <div class="check-list">
      <template v-for="item in checkItems">
        <div
          class="item"
          :key="item.iconType"
        >
          <md-icon
            :name="item.iconType"
            size="md"
            :color="item.iconType === 'check' ? '#ff5257' : '#5bb69e'"
          ></md-icon> {{item.text}} <template v-if="item.error">({{item.error}})</template>
        </div>
      </template>
    </div>

    <div class="footer">
      <mm-button
        type="primary"
        @click="check"
      >{{btnText}}</mm-button>
      <div class="tips">插件环境检测成功后自动进入登录页面</div>
    </div>

  </div>
</template>

<script>
export default {
  name: "page-check-env",
  data() {
    return {
      recheck: false,
      btnText: "重新检测",
      checkItems: [
        {
          iconType: "success",
          text: "成功切入chrome环境"
        },
        {
          iconType: "check",
          text: "成功登录Bet365"
        },
        {
          iconType: "check",
          text: "365网站会员在Oil King验证失败",
          error:""
        },
      ]
    };
  },
  created() {
    this.check();
  },
  methods: {
    async check() {
      const $background = chrome.extension.getBackgroundPage();

      const checkResult = await $background.checkEnv();

      checkResult.forEach((item, index) => {
        this.checkItems[index].iconType = item.iconType;
      });

      setTimeout(() => {
        const {iconType, error} = $background.autoLogin();
        console.log("check:", iconType, error)
        if(iconType){
          this.checkItems[2].iconType = iconType
          this.checkItems[2].error = error
        }
      
        if(this.checkItems[0].iconType === "success" && this.checkItems[1].iconType === "success" && this.checkItems[2].iconType === "success"){
          this.checkSuccess();
        }
      }, 1000)
    },

    async checkSuccess() {
      const $background = chrome.extension.getBackgroundPage();
      const {planId} = await $background.getCommonOps();
      setTimeout(() => {
        if(planId){
          this.$router.push("/bet/result/home");
        }else{
          this.$router.push("/bet/plan");
        }
      }, 500)
    }
  }
};
</script>

<style lang="scss">
.check-env {
  padding: 30px;

  .header {
    padding: 20px 0;
    font-size: 28px;
    border-bottom: 1px solid #ddd;
  }

  .title {
    margin-top: 60px;
    color: #ff5257;
    font-weight: 700;
    font-size: 32px;
  }

  .check-list {
    margin-top: 40px;
    padding-left: 60px;
    font-size: 28px;
    color: #666;

    .item {
      padding: 10px 0;
    }
  }

  .footer {
    position: fixed;
    bottom: 40px;
    left: 30px;
    right: 30px;

    .tips {
      text-align: center;
      margin-top: 40px;
      font-size: 14px;
      color: #999;
    }
  }
}
</style>