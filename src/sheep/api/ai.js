import request from '@/sheep/request';

// FastAPI后端地址
const fastApiBaseUrl = 'http://localhost:8000';

const ai = {
  // AI聊天
  chat: (params) => request({
    url: '/api/ai/ask',
    method: 'POST',
    baseURL: fastApiBaseUrl,
    data: params,
    timeout: 120000,
    custom: {
      auth: true,
      showError: true,
      showLoading: true,
      loadingMsg: 'AI正在思考...'
    }
  }),
  
  // 获取系统状态
  status: () => request({
    url: '/api/ai/status',
    method: 'GET',
    baseURL: fastApiBaseUrl,
    custom: {
      auth: false,
      showError: false
    }
  })
};

export default ai;
