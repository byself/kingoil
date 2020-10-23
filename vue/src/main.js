import Vue from 'vue'
import App from './App.vue'
import router from './router.js'

Vue.config.productionTip = false

import { InputItem, Field, FieldItem, Icon, Tabs, TabPane } from 'mand-mobile'

Vue.component(InputItem.name, InputItem)
Vue.component(Field.name, Field)
Vue.component(FieldItem.name, FieldItem)
Vue.component(Icon.name, Icon)
Vue.component(Tabs.name, Tabs)
Vue.component(TabPane.name, TabPane)

import Button from './components/button.vue'
Vue.component(Button.name, Button)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
