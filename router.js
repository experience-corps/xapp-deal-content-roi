import Vue from 'vue';
import Router from 'vue-router';
import Homepage from './homepage.vue';
import Opportunity from './opportunity.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/', 
      name: 'Choices', 
      component: Homepage
    }, 
    {
      path: '/opp', 
      name: 'Opp', 
      component: Opportunity, 
      props: true
    }
  ]
})
