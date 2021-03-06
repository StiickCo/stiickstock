import Vue from 'vue';
import Home from './views/Home.vue';
import Router from 'vue-router';
import Login from './views/Login.vue';
import Teams from './views/Teams.vue';
import TeamInfo from './views/TeamInfo.vue';
import AddTeam from './views/AddTeam.vue';
import PasswordRecovery from './views/PasswordRecovery.vue';
import Signup from './views/Signup.vue';
import ProductList from './views/ProductList.vue';
import ProductInfo from './views/ProductInfo.vue';
import Callback from './views/Callback.vue';
import NotLogged from './views/NotLogged.vue';
import NotFound from './views/NotFound.vue';

Vue.use(Router)

const router = new Router({
mode: 'history',
routes:  [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/products',
    name: 'products',
    component: ProductList
  },
  {
    path: '/teams',
    name: 'teams',
    component: Teams
  },
  {
    path: '/teams/add',
    name: 'teamsAdd',
    component: AddTeam
  },
  {
    path: '/team/info/:id',
    name: 'teamInfo',
    component: TeamInfo
  },
  {
    path: '/productInfo/:id',
    name: 'productInfo',
    component: ProductInfo
  },
  {
    path: '/login/recovery',
    name: 'recovery',
    component: PasswordRecovery
  },
  {
    path: '/login/signup',
    name: 'signup',
    component: Signup
  },
  {
    path: '/callback',
    name: 'callback',
    component: Callback,
  },
  {
    path: '/403',
    name: '403',
    component: NotLogged,
  },
  {
    path: '/404',
    name: '404',
    component: NotFound,
  },
]
});

router.beforeEach(async (to, from, next) => {
  if (to.path.includes('autoLogin')) {
    router.app.$auth.newLogin(to.query.user, to.query.pw, (err) => {
      if (err && err.code == "invalid_grant") {
        console.log("Invalid grant", err);
        next('login')
      } else if (err) {
        console.log("Error", err);
        next('login');
      }
    });
    //router.app.$auth.login();
    next('');
  } else if (router.app.$auth.isAuthenticated() && to.name == 'login') {
    next('');
  } else if (to.name == 'callback' || to.name == '403' || to.name == 'login' || to.name == 'signup' || to.name == 'recovery') { // check if "to"-route is "callback" and allow access
    next();
  } else if (router.app.$auth.isAuthenticated()) { // if authenticated allow access
    if(to.name == '' || to.name == 'gestaocontatos') {
      
      if(router.app.$store.getters.isManager || router.app.$store.getters.isDirector) {
        next();
      } else {
        next('/404');
      }
    } else {
      next();
    }
  } else { // trigger auth0 login
    next('login');
    //router.app.$auth.login();
  }
});
export default router
