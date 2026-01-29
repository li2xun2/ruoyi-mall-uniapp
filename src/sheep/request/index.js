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

// ========= 登录等待机制（解决：登录成功但鉴权请求被提前拦截） =========
let loginDeferred = null;

function ensureLoginDeferred() {
  if (loginDeferred) return loginDeferred;
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  loginDeferred = { promise, resolve, reject };
  return loginDeferred;
}

function clearLoginDeferred() {
  loginDeferred = null;
}

function notifyLoginSuccess() {
  if (!loginDeferred) return;
  loginDeferred.resolve(true);
  clearLoginDeferred();
}

function notifyLoginFail(error) {
  if (!loginDeferred) return;
  loginDeferred.reject(error);
  clearLoginDeferred();
}

function waitForLogin({ timeoutMs = 30000 } = {}) {
  const { promise } = ensureLoginDeferred();
  const timeoutPromise = new Promise((_, rej) => {
    setTimeout(() => rej(new Error('login timeout')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

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
    console.log('===== 请求拦截器 =====');
    console.log('请求 URL:', config.url);
    console.log('请求方法:', config.method);
    console.log('请求数据:', config.data);
    console.log('是否需要认证:', config.custom.auth);
    const token = uni.getStorageSync('token');
    console.log('从本地存储读取到的 token:', token);
    
    const userStore = $store('user');
    console.log('userStore.isLogin:', userStore.isLogin);
    console.log('是否有 token:', !!token);

    // 若本地已有 token，但 store 尚未恢复登录态，则先同步登录态，避免误拦截
    if (token && !userStore.isLogin) {
      console.log('本地有 token，但 userStore.isLogin 为 false，同步登录态');
      userStore.isLogin = true;
      console.log('同步后 userStore.isLogin:', userStore.isLogin);
    }
    
    // 特殊处理：如果请求的是获取会员信息，并且本地存储中有 token，就允许这个请求通过
    if (config.custom.auth && config.url.includes('h5/member/info') && token) {
      console.log('请求 /h5/member/info 需要认证，本地存储中有 token，允许请求通过');
      config.header['Authorization'] = token;
      console.log('设置请求头 Authorization:', token);
      return config;
    }
    
    // 以 token 为准判断登录态（避免 isLogin 未及时更新/不同实例导致误判）
    const isLoggedIn = userStore.isLogin || !!token;
    console.log('最终判断是否登录:', isLoggedIn);
    if (config.custom.auth && !isLoggedIn) {
      console.log('请求需要认证，但未登录，拒绝请求');
      if ($platform.name === 'WechatMiniProgram') {
        console.log('显示微信小程序登录弹窗');
        showAuthModal('wechatMiniLogin')
      } else {
        console.log('显示短信登录弹窗');
        showAuthModal('smsLogin')
      }
      // 等待登录成功后再继续发起本次请求（避免登录接口已成功但本次鉴权请求被提前拦截）
      console.log('等待登录成功后再继续发起本次请求');
      return waitForLogin({ timeoutMs: 30000 })
        .then(() => {
          const newToken = uni.getStorageSync('token');
          console.log('登录成功后，从本地存储读取到的新 token:', newToken);
          if (newToken) {
            config.header['Authorization'] = newToken;
            console.log('设置请求头 Authorization:', newToken);
          }
          return config;
        })
        .catch((e) => {
          console.log('等待登录超时或失败，终止请求:', e);
          // 仍未登录或超时，则终止本次请求
          return Promise.reject(e);
        });
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
    if (token) config.header['Authorization'] = token;
    console.log('请求头:', config.header);
    return config;
  },
  (error) => {
    console.log('请求错误:', error);
    return Promise.reject(error);
  },
);

/**
 * @description 响应拦截器
 */
http.interceptors.response.use(
  (response) => {
    // 自动设置登陆令牌
    console.log('===== 响应拦截器 =====');
    console.log('响应 URL:', response.config.url);
    console.log('响应完整数据:', response);
    console.log('响应 data:', response.data);
    if (response.config.url.includes('h5/account/login') ||
        response.config.url.includes('h5/sms/login') ||
        response.config.url.includes('h5/wechat/login') ||
        response.config.url.includes('h5/register') ||
        response.config.url.includes('h5/account/register') ||
        response.config.url.includes('no-auth/wechat/getWechatUserAuth')
        ) {
      // 检查响应结构，支持新的 AjaxResult 格式
      console.log('===== 检查响应中的 token =====');
      console.log('响应 URL:', response.config.url);
      console.log('响应完整数据:', response);
      console.log('响应 data:', response.data);
      console.log('response.data?.data?.token:', response.data?.data?.token);
      console.log('response.data?.token:', response.data?.token);
      console.log('URL 包含 login:', response.config.url.includes('login'));
      console.log('URL 包含 register:', response.config.url.includes('register'));
      
      // 直接从 response.data 中获取 token，不管结构如何
      let token = null;
      // 1) { token: 'xxx' }
      if (response.data?.token) {
        token = response.data.token;
        console.log('从 response.data.token 获取到 token:', token);
      }
      // 2) { data: { token: 'xxx' } }
      else if (response.data?.data?.token) {
        token = response.data.data.token;
        console.log('从 response.data.data.token 获取到 token:', token);
      }
      // 3) { data: 'xxx' }  (RuoYi 常见：data 直接就是 token 字符串)
      else if (typeof response.data?.data === 'string') {
        token = response.data.data;
        console.log('从 response.data.data 获取到 token:', token);
      }
      // 4) { data: { access_token: 'xxx' } } 等字段名兼容
      else if (response.data?.data?.access_token) {
        token = response.data.data.access_token;
        console.log('从 response.data.data.access_token 获取到 token:', token);
      } else if (response.data?.data?.accessToken) {
        token = response.data.data.accessToken;
        console.log('从 response.data.data.accessToken 获取到 token:', token);
      }
      
      console.log('最终提取到的 token:', token);
      
      if (token) {
        // 先强制写入本地，确保后续鉴权请求可放行并携带 Authorization
        console.log('准备将 token 写入本地存储:', token);
        uni.setStorageSync('token', token);
        console.log('写入本地存储后，从本地存储读取 token:', uni.getStorageSync('token'));

        // 再同步到 store（包含后续 loginAfter 的流程）
        console.log('准备设置 token 到 userStore:', token);
        const userStore = $store('user');
        console.log('设置前 userStore.isLogin:', userStore.isLogin);
        try {
          const result = userStore.setToken(token);
          console.log('userStore.setToken 结果:', result);
        } catch (e) {
          console.log('userStore.setToken 失败，回退到直接设置 isLogin=true:', e);
          userStore.isLogin = true;
        }
        console.log('设置后 userStore.isLogin:', userStore.isLogin);
        console.log('从本地存储读取 token:', uni.getStorageSync('token'));
        // 唤醒所有等待登录的鉴权请求
        console.log('唤醒所有等待登录的鉴权请求');
        notifyLoginSuccess();
      } else {
        console.log('响应中未找到 token');
      }
    } else if (response.config.url.includes('no-auth/wechat/getSessionId')) {
      console.log('===== 处理 no-auth/wechat/getSessionId 响应 =====');
      console.log('响应 data:', response.data);
      console.log('准备设置 token:', response.data?.data?.token);
      const userStore = $store('user');
      userStore.setToken(response.data?.data?.token);
    }
    response.config.custom.showLoading && closeLoading();
    const { data } = response
    if (data && data.code && data.code !== 200){
      let errorMsg = data.msg || '服务器内部错误'
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
        // 登录失效，唤醒等待队列（避免请求一直挂起）
        notifyLoginFail(new Error('unauthorized'));
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
    const userStore = $store('user');
    const isLogin = userStore.isLogin;
    let errorMessage = '网络请求出错';
    if (error !== undefined) {
      switch (error.statusCode) {
        case 400:
          errorMessage = '请求错误';
          break;
        case 401:
          if (isLogin) {
            errorMessage = '您的登录已过期';
          } else {
            errorMessage = '请先登录';
          }
          userStore.logout(true);
          showAuthModal();
          break;
        case 403:
          errorMessage = '拒绝访问';
          break;
        case 404:
          errorMessage = '请求出错';
          break;
        case 408:
          errorMessage = '请求超时';
          break;
        case 429:
          errorMessage = '请求频繁, 请稍后再访问';
          break;
        case 500:
          errorMessage = '服务器开小差啦,请稍后再试~';
          break;
        case 501:
          errorMessage = '服务未实现';
          break;
        case 502:
          errorMessage = '网络错误';
          break;
        case 503:
          errorMessage = '服务不可用';
          break;
        case 504:
          errorMessage = '网络超时';
          break;
        case 505:
          errorMessage = 'HTTP版本不受支持';
          break;
        default:
          errorMessage = '服务器开小差啦,请稍后再试~';
          break;
      }
      if (error.errMsg.includes('timeout')) errorMessage = '请求超时';
      // #ifdef H5
      if (error.errMsg.includes('Network'))
        errorMessage = window.navigator.onLine ? '服务器异常' : '请检查您的网络连接';
      // #endif
    }

    if (error && error.config) {
      if (error.config.custom.showError === false) {
        uni.showToast({
          title: error.data?.msg || errorMessage,
          icon: 'none',
          mask: true,
        });
      }
      error.config.custom.showLoading && closeLoading();
    }

    return Promise.reject(errorMessage);
  },
);

const request = (config) => {
  if (config.url[0] !== '/') {
    config.url = apiPath + config.url;
  }
  return http.middleware(config);
};

export default request;
