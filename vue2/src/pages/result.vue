<template>
  <div class="result">
    <div class="tabs">
      <template v-for="tab in tabs">
        <router-link
          class="tab"
          :class="{active: tab.path === $route.path}"
          :key="tab.id"
          :to='`${tab.path}?id=${planId}`'
        >{{tab.name}}</router-link>
      </template>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "page-result",
  data() {
    return {
      tabs: [
        {
          id: 1,
          name: "运营汇总",
          path: "/bet/result/home"
        },
        {
          id: 3,
          name: "投注方案",
          path: "/bet/plan"
        }
      ],
      planId: this.$route.query.id
    };
  },
  created() {
    console.log(this.$route);
  }
};
</script>

<style lang="scss">
.result {
  margin-top: 40px;

  .tabs {
    display: flex;
    border-bottom: 1px solid #ddd;

    .tab {
      padding: 0 30px;
      height: 60px;
      line-height: 60px;
      border-width: 1px 0 0 1px;
      border-color: #ddd;
      border-style: solid;
      font-size: 26px;
      cursor: pointer;
      text-decoration: none;
      color: #666;

      &:last-child {
        border-right-width: 1px;
      }

      &.active {
        background-color: #d30519;
        color: #fff;
      }
    }
  }
}
</style>