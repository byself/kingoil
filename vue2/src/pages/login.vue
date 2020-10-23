<template>
  <div class="login">
    <div class="logo">
      <img class="icon" src="@/assets/logo.jpg" />
    </div>

      <md-field>
        <div class="tips">
          注意：同一账号一天输错密码5次，将直接被禁用
        </div>
        <md-input-item
          title="用户名"
          placeholder="请输入用户名"
          v-model="username"
        ></md-input-item>
        <md-input-item
          type="password"
          title="密码"
          placeholder="请输入密码"
          v-model="password"
        ></md-input-item>


        <div class="error">
          {{error}}
        </div>

        <mm-button
          type="primary"
          @click="login"
        >登录</mm-button>
      </md-field>

    </div>
</template>

<script>
export default {
  name: "page-login",
  async beforeRouteEnter(to, from, next){
    const $background = chrome.extension.getBackgroundPage();
    const {uid} = await $background.getCommonOps();

    if(uid){
      next("/check")
    }else{
      next()
    }
  },
  data() {
    return {
      username: "",
      password: "",
      error: ""
    };
  },
  methods: {
    login() {
      if (!this.username) {
        this.error = "用户名不能为空";
        return;
      }

      if (!this.password) {
        this.error = "密码不能为空";
        return;
      }

      const $background = chrome.extension.getBackgroundPage();
      $background.login(this.username, this.password).then(res => {
        console.log(res);
        const { return_code, return_msg } = res;
        if (return_code === "0") {
          this.$router.push("/check");
        } else {
          this.error = return_msg;
        }
      });
    }
  }
};
</script>

<style lang="scss">
.login {
  // padding: 0 50px;
}

.logo {
  padding: 80px 0 40px;
  text-align: center;
  .icon {
    width: 160px;
    height: auto;
  }
}

.tips {
  padding-bottom: 40px;
  font-size: 26px;
  color: #666;
}

.login-input {
  margin: 40px 0;
  border: 1px solid #eee;
  border-radius: 4px;

  input {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 80px;
    line-height: 80px;
    border: 0;
    outline: none;
    text-indent: 20px;
    font-size: 28px;
  }
}

.error {
  padding: 60px 0;
  height: 40px;
  line-height: 40px;
  color: #d30519;
  font-size: 24px;
}
</style>