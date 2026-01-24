/**
 * Shopro-request
 * @description api模块管理，loading配置，请求拦截，错误处理
 */

import Request from 'luch-request';
import {apiPath, baseUrl} from '@/sheep/config';
import $store from '@/sheep/store';
import $platform from '@/sheep/platform';
import {showAuthModal} from '@/sheep/hooks/useModal';
import sheep from '@/sheep';

// 创建一个全局的 userStore 实例，这样请求拦截器和响应拦截器就会使用同一个实例
const userStore = $store('user');

const options = {
  // 显示操作成功消息 默认不显示
  showSuccess: false,
  // 成功提醒 默认使用后端返回值
  successMsg: '',
  // 显示失败消息 默认显示
  showError: true,
  // 失败提醒 默认使用后端返回信息
  errorMsg: '',
  // 显示请求时loading模态框 默认显示
  showLoading: true,
  // loading提醒文字
  loadingMsg: '加载中',
  // 需要授权才能请求 默认放开
  auth: false,
  // ...
};

// Loading全局实例
let LoadingInstance = {
  target: null,
  count: 0,
};

/**
 * 关闭loading
 */
function closeLoading() {
  if (LoadingInstance.count > 0) LoadingInstance.count--;
  if (LoadingInstance.count === 0) uni.hideLoading();
}

/**
 * @description 请求基础配置 可直接使用访问自定义请求
 */
const http = new Request({
  baseURL: baseUrl,
  timeout: 8000,
  method: 'GET',
  header: {
    Accept: 'application/json',
    'Content-Type': 'application/json;charset=UTF-8',
    platform: $platform.name,
  },
  // #ifdef APP-PLUS
  sslVerify: false,
  // #endif
  // #ifdef H5
  // 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+）
  withCredentials: false,
  // #endif
  custom: options,
});

/**
 * @description 请求拦截器
 */
http.interceptors.request.use(
  (config) => {
    console.log('Request URL:', config.url);
    console.log('Request Method:', config.method);
    console.log('Request Data:', config.data);
    console.log('Request Auth:', config.custom.auth);
    console.log('Is Login:', userStore.isLogin);
    
    if (config.custom.auth && !userStore.isLogin) {
      // 打印 userStore 实例，以便确定问题所在
      console.log('Auth required but not logged in, rejecting request');
      console.log('User store:', userStore);
      console.log('User store state:', userStore.$state);
      // 特殊处理：如果请求的是获取会员信息，并且本地存储中有 token，就允许这个请求通过
      const token = uni.getStorageSync('token');
      if (config.url.includes('h5/member/info') && token) {
        console.log('Auth required but token exists in storage, allowing request');
        console.log('Token in storage:', token);
        // 手动设置 token 到请求头中
        config.header['Authorization'] = token;
      } else {
        console.log('Auth required but not logged in, rejecting request');
        if ($platform.name === 'WechatMiniProgram') {
          showAuthModal('wechatMiniLogin')
        } else {
          showAuthModal('smsLogin')
        }
        return Promise.reject();
      }
    }
    if (config.custom.showLoading) {
      LoadingInstance.count++;
      LoadingInstance.count === 1 &&
        uni.showLoading({
          title: config.custom.loadingMsg,
          mask: true,
          fail: () => {
            uni.hideLoading();
          },
        });
    }
    const token = uni.getStorageSync('token');
    if (token) config.header['Authorization'] = token;
    console.log('Request Headers:', config.header);
    return config;
  },
  (error) => {
    console.log('Request Error:', error);
    return Promise.reject(error);
  },
);

/**
 * @description 响应拦截器
 */
http.interceptors.response.use(
  (response) => {
    // 自动设置登陆令牌
    console.log('Response URL:', response.config.url);
    console.log('Response Full:', response);
    console.log('Response Data:', response.data);
    if (response.config.url.includes('h5/account/login') ||
        response.config.url.includes('h5/sms/login') ||
        response.config.url.includes('h5/wechat/login') ||
        response.config.url.includes('h5/register') ||
        response.config.url.includes('h5/account/register') ||
        response.config.url.includes('no-auth/wechat/getWechatUserAuth')
        ) {
      // 检查响应结构，支持新的 AjaxResult 格式
      console.log('Checking for token in response...');
      console.log('response.data?.data?.token:', response.data?.data?.token);
      console.log('response.data?.token:', response.data?.token);
      console.log('URL includes login:', response.config.url.includes('login'));
      console.log('URL includes register:', response.config.url.includes('register'));
      
      // 直接从 response.data 中获取 token，不管结构如何
      let token = null;
      if (response.data?.token) {
        token = response.data.token;
      } else if (response.data?.data?.token) {
        token = response.data.data.token;
      }
      
      console.log('Extracted token:', token);
      
      if (token) {
        console.log('Setting token:', token);
        console.log('Before setToken - isLogin:', userStore.isLogin);
        const result = userStore.setToken(token);
        console.log('setToken result:', result);
        console.log('After setToken - isLogin:', userStore.isLogin);
        console.log('Token in storage:', uni.getStorageSync('token'));
      } else {
        console.log('No token found in response');
      }
    } else if (response.config.url.includes('no-auth/wechat/getSessionId')) {
      $store('user').setToken(response.data?.data?.token);
    }
    response.config.custom.showLoading && closeLoading();
    const { data } = response
    if (data && data.code && data.code !== 200){
      let errorMsg = data.msg
      if (data.code === 401){
        //无权限
        const userStore = $store('user')
        const isLogin = userStore.isLogin
        if (isLogin) {
          errorMsg = '您的登录已过期'
        } else {
          errorMsg = '请先登录'
        }
        userStore.logout(true)
        // 获取当前页面栈数组
        const pages = getCurrentPages();
        // 获取数组中的最后一个元素，即当前页面
        const currentPage = pages[pages.length - 1];
        // 获取当前页面的路径
        const currentPath = currentPage.route;
        if (!['pages/index/accountIndex','pages/index/index'].includes(currentPath)) {
          sheep.$helper.toast(errorMsg)
          if ($platform.name === 'WechatMiniProgram') {
            showAuthModal('wechatMiniLogin')
          } else {
            showAuthModal('smsLogin')
          }
        }
      }
      else if (data.code === 500){
        sheep.$helper.toast(errorMsg)
      }
      else {
        uni.showToast({
          title: errorMsg || '服务器开小差啦,请稍后再试~',
          icon: 'none',
          mask: true,
        });
      }
      return Promise.reject(errorMsg)
    }
    //成功的提示
    if (response.config.custom.showSuccess && response.config.custom.successMsg) {
      uni.showToast({
        title: response.config.custom.successMsg,
        icon: 'none',
      });
    }
    return Promise.resolve(data);
    // if (response.data.error !== 0) {
    //   if (response.config.custom.showError)
    //     uni.showToast({
    //       title: response.data.msg || '服务器开小差啦,请稍后再试~',
    //       icon: 'none',
    //       mask: true,
    //     });
    //   return Promise.resolve(response.data);
    // }
    // if (
    //   response.data.error === 0 &&
    //   response.data.msg !== '' &&
    //   response.config.custom.showSuccess
    // ) {
    //   uni.showToast({
    //     title: response.config.custom.successMsg || response.data.msg,
    //     icon: 'none',
    //   });
    // }
  },
  (error) => {
    // const userStore = $store('user');
    // const isLogin = userStore.isLogin;
    // let errorMessage = '网络请求出错';
    // if (error !== undefined) {
    //   switch (error.statusCode) {
    //     case 400:
    //       errorMessage = '请求错误';
    //       break;
    //     case 401:
    //       if (isLogin) {
    //         errorMessage = '您的登陆已过期';
    //       } else {
    //         errorMessage = '请先登录';
    //       }
    //       userStore.logout(true);
    //       showAuthModal();
    //       break;
    //     case 403:
    //       errorMessage = '拒绝访问';
    //       break;
    //     case 404:
    //       errorMessage = '请求出错';
    //       break;
    //     case 408:
    //       errorMessage = '请求超时';
    //       break;
    //     case 429:
    //       errorMessage = '请求频繁, 请稍后再访问';
    //       break;
    //     case 500:
    //       errorMessage = '服务器开小差啦,请稍后再试~';
    //       break;
    //     case 501:
    //       errorMessage = '服务未实现';
    //       break;
    //     case 502:
    //       errorMessage = '网络错误';
    //       break;
    //     case 503:
    //       errorMessage = '服务不可用';
    //       break;
    //     case 504:
    //       errorMessage = '网络超时';
    //       break;
    //     case 505:
    //       errorMessage = 'HTTP版本不受支持';
    //       break;
    //   }
    //   if (error.errMsg.includes('timeout')) errorMessage = '请求超时';
    //   // #ifdef H5
    //   if (error.errMsg.includes('Network'))
    //     errorMessage = window.navigator.onLine ? '服务器异常' : '请检查您的网络连接';
    //   // #endif
    // }
    //
    // if (error && error.config) {
    //   if (error.config.custom.showError === false) {
    //     uni.showToast({
    //       title: error.data?.msg || errorMessage,
    //       icon: 'none',
    //       mask: true,
    //     });
    //   }
    //   error.config.custom.showLoading && closeLoading();
    // }
    //
    return false;
  },
);

const request = (config) => {
  if (config.url[0] !== '/') {
    config.url = apiPath + config.url;
  }
  return http.middleware(config);
};

export default request;
