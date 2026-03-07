import request from '@/sheep/request';

export default {
  generateVerifiedCode: (params) =>
    request({
      url: '/h5/verified/code/generate',
      method: 'GET',
      params
     }),
  area: () =>
    request({
      url: '/h5/area',
      method: 'GET',
    }),
  faq: (data = {}, params = { page: 0, size: 10 }) =>
    request({
      url: '/api/ai/faqs/list',
      method: 'POST',
      data,
      params
    }),
  richtext: (id) =>
    request({
      url: 'data/richtext/' + id,
      method: 'GET',
    }),
  getSysConfig: (params) =>
    request({
        url: '/no-auth/config/get',
        method: 'GET',
        params,
        custom: {
            showSuccess: false,
            auth: false,
        },
    }),
    getIntegralBalance: (data) =>
        request({
            url: '/h5/act/integral/stat',
            method: 'post',
            data,
            custom: {
                showSuccess: false,
            },
        }),
    integralHistoryList: (data, params) =>
        request({
            url: '/h5/act/integral/history/list',
            method: 'post',
            data,
            params,
            custom: {
                showLoading: true,
            },
        }),
};
