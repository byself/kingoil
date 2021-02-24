import Vue from 'vue'
import Router from 'vue-router'
import CheckEnv from './common/checkenv'

Vue.use(Router)

import Check from './pages/checkenv.vue'
import Login from './pages/login.vue'
import BetPage from './pages/bet.vue'
import Plan from './pages/plan.vue'
import PlanDetail from './pages/detail.vue'
import Result from './pages/result.vue'
import Home from './pages/home.vue'
import Log from './pages/log.vue'

const route = new Router({
  routes: [
    {
      path: '/',
      component: Check
    },
    {
      path: '/login',
      component: Login
    },
    {
      path: '/bet',
      component: BetPage,
      children: [
        {
          path: 'plan',
          component: Plan
        },
        {
          path: 'detail',
          component: PlanDetail
        },
        {
          path: 'result',
          component: Result,
          children: [
            {
              path: 'home',
              component: Home
            },
            {
              path: 'log',
              component: Log
            }
          ]
        }
      ]
    }
  ]
})

// const check = new CheckEnv();

// route.beforeEach((to, from, next) => {
//     const isSuccessEnv = check.isSuccess();
//     const isLogin = isLogin();

//     if(!isSuccessEnv){
//         next("/")
//     }else if(!isLogin){
//         next("/login")
//     }else(
//         next("/bet/monitor")
//     )
// })

export default route
