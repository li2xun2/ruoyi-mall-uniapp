// 开发环境配置
export let baseUrl;
export let version;
// 直接使用本地开发环境地址，确保所有请求都走本地后端服务
baseUrl = 'http://localhost:8080/';
version = 'v1.8.1';
console.log(`[Shopro ${version}]  https://www.sheepjs.com/`);
console.log(`[Base URL] ${baseUrl}`);
export const apiPath = '';

export const staticUrl = 'local';

export default {
  baseUrl,
  apiPath,
  staticUrl,
};
