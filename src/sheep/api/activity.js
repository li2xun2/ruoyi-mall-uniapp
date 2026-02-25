import request from '@/sheep/request';

export default {
  myGroupon: (params) =>
    request({
      url: 'activity/groupon/myGroupons',
      method: 'GET',
      params,
    }),
  getGrouponList: (params) =>
    request({
      url: 'activity/groupon',
      method: 'GET',
      params,
    }),
  grouponDetail: (id) =>
    request({
      url: 'activity/groupon/' + id,
      method: 'GET',
    }),
  signList: (params) =>
    request({
      url: 'h5/act/sign/list',
      method: 'GET',
      params,
      auth: true
    }),
  signAdd: (data) =>
    request({
      url: 'h5/act/sign/add',
      method: 'POST',
      data,
      auth: true
    }),
  replenish: (data) =>
    request({
      url: 'h5/act/sign/replenish',
      method: 'POST',
      data,
      auth: true
    }),
  activity: (id) =>
    request({
      url: 'activity/activity/' + id,
      method: 'GET',
    }),
  // 积分相关API
  integralList: (params) =>
    request({
      url: 'h5/act/integral/list',
      method: 'GET',
      params,
      auth: true
    }),
  integralAdd: (data) =>
    request({
      url: 'h5/act/integral/add',
      method: 'POST',
      data,
      auth: true
    }),
  integralHistoryList: (data) =>
    request({
      url: 'h5/act/integral/history/list',
      method: 'POST',
      data,
      auth: true
    }),
  integralStat: (data) =>
    request({
      url: 'h5/act/integral/stat',
      method: 'POST',
      data,
      auth: true
    }),
  // 积分商城相关API
  integralGoodsList: () =>
    request({
      url: 'h5/integral/goods/list',
      method: 'GET',
      auth: true
    }),
  integralGoodsDetail: (id) =>
    request({
      url: 'h5/integral/goods/detail',
      method: 'GET',
      params: { id },
      auth: true
    }),
  integralExchange: (data) =>
    request({
      url: 'h5/integral/exchange',
      method: 'POST',
      data,
      auth: true
    }),
  integralExchangeList: () =>
    request({
      url: 'h5/integral/exchange/list',
      method: 'GET',
      auth: true
    })
};
