<template>
  <div class="bet">
    <div class="bet-header">
      <span class="item"
        >365账号：<span class="red">{{ username }}</span>
      </span>
      <span class="item"
        >账户金额：<span class="red">{{ amount }}</span></span
      >
    </div>
  <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "layout-bet",
  data() {
    return {
      username: "",
      amount: ""
    };
  },
  created() {
    this.getUserInfo();

    chrome.runtime.onMessage.addListener(this.messageHandler)
  },
  methods: {
    async getUserInfo() {
      const $background = chrome.extension.getBackgroundPage();
      const { username, amount } = await $background.getCommonOps();

      this.username = username;
      this.amount = amount;
    },
    
    messageHandler(request, sender, sendResponse){
      switch (request.event) {
          case 'event-refresh-amount':
            this.refreshAmount(request)
            break
      }

      return true
    },

    refreshAmount(request){
      this.amount = request.data.amount
    }
  }
};
</script>

<style lang="scss">
.bet {
  padding: 20px;
}

.bet-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  font-size: 24px;

  .item {
    margin-right: 20px;
  }

  .red {
    color: #d30519;
  }
}
</style>
