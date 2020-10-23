<template>
  <div class="detail">
    <div class="title">
      <md-icon
        name="home"
        size="md"
        color="#d30519"
      ></md-icon> 投标方案详情
    </div>

    <div class="content">
      {{plan.bet_plan_detail}}
    </div>

    <div class="footer">
      <div class="btnGroup">
        <mm-button
          type="primary"
          @click="back"
        >返回</mm-button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: "page-detail",
  data() {
    return {
      planId: this.$route.query.id,
      plan: {},
    };
  },
  created() {
    this.getBetPlan();
  },
  methods: {
    getBetPlan() {
      const $background = chrome.extension.getBackgroundPage();
      $background.getBetPlan().then(res => {
        console.log(res);
        this.queryDetail(res.return_data);
      });
    },

    queryDetail(data) {
      data.forEach(plan => {
        console.log(plan.bet_plan_id, this.planId);
        if (plan.bet_plan_id === this.planId) {
          this.plan = plan;
        }
      });
    },

    back() {
      this.$router.back();
    }
  }
};
</script>

<style lang="scss">
.detail {
  padding: 0 30px;

  .title {
    margin-top: 60px;
    color: #d30519;
    font-weight: 700;
    font-size: 28px;
  }

  .content {
    margin: 60px 0;
    height: 680px;
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 26px;
  }

  .footer {
    .btnGroup {
      display: flex;
      justify-content: space-between;
      margin: 0 -20px;
      .mm-button {
        margin: 0 20px;
      }
    }
  }
}
</style>