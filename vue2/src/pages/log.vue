<template>
  <div class="result-log">
    <template v-for="log in logs">
      <div :key="log.time">{{log.time}} <span :class="{bold: log.bold}">{{log.content}}</span></div>
    </template>
  </div>
</template>

<script>
// 3个内容红色：
// 1、服务器确认投注信息
// 2、投注成功/失败
// 3、投注赢利或亏钱
export default {
  name: "page-result-log",
  data() {
    return {
      logs: [
        {
          time: "2020-01-02 08:12:13",
          content: "数据监控",
          bold: false
        },
        {
          time: "2020-01-02 08:12:13",
          content: "[NBA]湖人VS森林狼，投注5555赢球，盈利244.42",
          bold: true
        }
      ]
    };
  },
  created() {
    this.init();
  },
  methods: {
    init() {
      // setInterval(() => {
      //   this.update({
      //     time: Date.now(),
      //     content: "数据监控",
      //     bold: false
      //   });
      // }, 1000);
    },
    update(log) {
      this.logs.unshift(log);
    }
  }
};
</script>

<style lang="scss">
.result-log {
  margin-top: 40px;
  height: 880px;
  font-size: 26px;
  overflow-x: hidden;
  overflow-y: auto;

  div {
    margin: 10px 0;

    .bold {
      color: #d30519;
    }
  }
}
</style>