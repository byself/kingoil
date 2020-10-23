<template>
  <div class="plan">
    <div class="title">
      <md-icon
        name="home"
        size="md"
        color="#d30519"
      ></md-icon> {{plan.bet_plan_name}}
    </div>

    <div class="content" v-html="plan.bet_plan_detail"></div>

    <!-- <div class="items" v-if="count <= 10">
      <template v-for="plan in plans">
        <div
          class="item"
          :class="{active: plan.bet_plan_id === currentPlanId}"
          v-if="plan.bet_plan_id"
          :key="plan.bet_plan_id"
        >
          <div
            class="name"
          >
            {{plan.bet_plan_name}}
          </div>
          <div
            class="link"
            @click="jumpTo(plan)"
          >查看方案详情</div>
        </div>
      </template>
    </div>
    <div class="error" v-if="count > 10">{{errorText}}</div> -->

    <div class="footer">
      <div class="btnGroup">
        <mm-button
          type="primary"
          @click="beginMonitor"
        >投注方案无误，开始执行</mm-button>
      </div>

      <div class="tips">
        规则调整，请前往www.oilking.com
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "page-plan",
  data() {
    return {
      plan: {},
      count: 1,
      errorText: ""
    };
  },
  created() {
    this.getBetPlan();
  },
  methods: {
    getBetPlan() {
      if(this.count > 10) {
        this.errorText = "接口报错，请联系管理员"
        return
      }

      this.count++

      console.log("count:", this.count)

      const $background = chrome.extension.getBackgroundPage();
      $background.getBetPlan().then(res => {
        console.log(res);
        if(res.return_code === '0'){
          this.plan = res.return_data[0];

          console.log("plan:", this.plan)
        }else{
          this.getBetPlan()
        }
      }).catch(() => {
        this.getBetPlan()
      });
    },

    beginMonitor() {
      const $background = chrome.extension.getBackgroundPage();
      $background.beginMonitor();

      this.jumpResult();
    },

    jumpResult() {
      this.$router.push({
        path: "result/home",
        query: {
          id: this.currentPlanId
        }
      });
    },

    jumpTo(plan) {
      this.$router.push({
        path: "detail",
        query: {
          id: plan.bet_plan_id
        }
      });
    }
  }
};
</script>

<style lang="scss">
.plan {
  padding: 0 30px;

  .title {
    margin-top: 60px;
    color: #d30519;
    font-weight: 700;
    font-size: 28px;
  }

  .content {
    margin: 40px 0 40px 40px;
    height: 680px;
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 26px;
    line-height: 40px;
  }

  // .items {
  //   display: flex;
  //   margin: 60px 0;
  //   flex-wrap: wrap;

  //   .item {
  //     width: 260px;
  //     margin: 0 20px 60px;
  //     font-size: 24px;
  //     text-align: center;
  //     cursor: pointer;

  //     .name {
  //       margin-bottom: 40px;
  //       width: 100%;
  //       height: 140px;
  //       line-height: 140px;
  //       background-color: #ddd;
  //     }

  //     .link {
  //       text-decoration: underline;
  //     }

  //     &.active {
  //       .name {
  //         color: #fff;
  //         background-color: #d30519;
  //       }
  //     }
  //   }
  // }

  .footer {
    position: absolute;
    left: 50px;
    right: 50px;
    bottom: 40px;

    .btnGroup {
      display: flex;
      justify-content: space-between;
      margin: 0 -20px;
      .mm-button {
        margin: 0 10px;
      }
    }

    // .mm-button {
    //   margin-bottom: 40px;
    // }
    .tips {
      margin-top: 60px;
      font-size: 24px;
      color: #999;
      text-align: center;
    }
  }
}
</style>