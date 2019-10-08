import { queryNotices } from '@/services/api';
import {routerRedux} from 'dva/router'
export default {
  namespace: 'global',

  state: {
    collapsed: false,
    notices: [],
    tabList: [
      { title: '首页', route: '/', key: '0', default: true },
    ],
    activeTab: '0'
  },

  effects: {
    *fetchNotices(_, { call, put, select }) {
      const data = yield call(queryNotices);
      yield put({
        type: 'saveNotices',
        payload: data,
      });
      const unreadCount = yield select(
        state => state.global.notices.filter(item => !item.read).length
      );
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: data.length,
          unreadCount,
        },
      });
    },

    *clearNotices({ payload }, { put, select }) {
      yield put({
        type: 'saveClearedNotices',
        payload,
      });
      const count = yield select(state => state.global.notices.length);
      const unreadCount = yield select(
        state => state.global.notices.filter(item => !item.read).length
      );
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: count,
          unreadCount,
        },
      });
    },
    *changeNoticeReadState({ payload }, { put, select }) {
      const notices = yield select(state =>
        state.global.notices.map(item => {
          const notice = { ...item };
          if (notice.id === payload) {
            notice.read = true;
          }
          return notice;
        })
      );
      yield put({
        type: 'saveNotices',
        payload: notices,
      });
      yield put({
        type: 'user/changeNotifyCount',
        payload: {
          totalCount: notices.length,
          unreadCount: notices.filter(item => !item.read).length,
        },
      });
    },
    *closeTab({ payload }, { put, select }) {
     
      let tabsList = yield select(state => { return state.global.tabList });
      let active = yield select(state => { return state.global.activeTab });
      let index;
      let isChangeActive = false;
      if (payload.key === active) {
        isChangeActive = true;
      }
    
      for (var i in tabsList) {
        if (tabsList[i].key === payload.key) {
          index = i;
        }
      }
      if (isChangeActive) {
        yield put({
          type: 'saveActiveTab',
          payload: tabsList[index - 1].key,
        });
        yield put(routerRedux.push(tabsList[index-1].route));
      }
      tabsList.splice(index, 1);
      yield put({
        type: 'saveTabsList',
        payload: tabsList,
      });

    },
    *refresh({ payload }, { put, select }) {
      console.log(payload.pathname);
      let menu = yield select(state => { return state.menu.breadcrumbNameMap });
      let tabsList = yield select(state => { return state.global.tabList });
      var data=menu[payload.pathname];
      var isHave=false
      for (var i in tabsList) {
        if (tabsList[i].route === data.path) {
          isHave=true;
        }
      }
      console.log(data);
      if(!isHave){
        var key = Date.parse(new Date());
        tabsList.push({
          route: data.path,
          title:data.name,
          key:key.toString()
        });
        yield put({
          type: 'saveTabsList',
          payload: tabsList,
        });
        yield put({
          type: 'saveActiveTab',
          payload: key.toString(),
        });
      }
    },
    *TabChange({ payload }, { put, select }) {
      console.log(payload);
      let tabsList = yield select(state => { return state.global.tabList });
      let index;
      for (var i in tabsList) {
        if (tabsList[i].key === payload) {
          index = i;
        }
      }
      yield put({
        type: 'saveActiveTab',
        payload: payload,
      });
      console.log(payload);
      yield put(routerRedux.push(tabsList[index].route));

    },
    *clickMenu({ payload }, { put, select }) {
      console.log('sssss', payload);
      let tabsList = yield select(state => { return state.global.tabList });
      let active = yield select(state => { return state.global.activeTab });
      let index = null;
      for (var i in tabsList) {
        if (tabsList[i].route === payload.route) {
          index = i;
        }
      }
      if (index!==null) {
        yield put({
          type: 'saveActiveTab',
          payload: tabsList[index].key,
        });
      } else {
        var key = Date.parse(new Date());
        tabsList.push({
          ...payload,
          key:key.toString()
        });
        yield put({
          type: 'saveTabsList',
          payload: tabsList,
        });
        yield put({
          type: 'saveActiveTab',
          payload: key.toString(),
        });
      }
    },
  },

  reducers: {
    saveTabsList(state, { payload }) {
      return {
        ...state,
        tabsList: payload
      }
    },
    saveActiveTab(state, { payload }) {
      return {
        ...state,
        activeTab: payload
      }
    },
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload,
      };
    },
    saveNotices(state, { payload }) {
      return {
        ...state,
        notices: payload,
      };
    },
    saveClearedNotices(state, { payload }) {
      return {
        ...state,
        notices: state.notices.filter(item => item.type !== payload),
      };
    },
  },

  subscriptions: {
    setup({ history }) {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      return history.listen(({ pathname, search }) => {
        if (typeof window.ga !== 'undefined') {
          window.ga('send', 'pageview', pathname + search);
        }
      });
    },
  },
};
