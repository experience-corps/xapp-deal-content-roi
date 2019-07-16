import Vue from 'vue';
import Main from './components/main.vue';
import router from './components/router.js'
import Chartkick from 'vue-chartkick'

Vue.use(Chartkick)

new Vue({
  el : '#app', 
  render: h => h(Main), 
  router
})