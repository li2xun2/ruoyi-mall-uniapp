import request from '../request'

// 客服相关API
const customerApi = {
  // 创建会话
  createSession: (params) => request({ url: `/h5/customer/session/create?userId=${params.userId}&customerId=${params.customerId}`, method: 'POST' }),
  
  // 获取会话列表
  getSessionList: (userId) => request({ url: `/h5/customer/session/list?userId=${userId}`, method: 'GET' }),
  
  // 获取会话详情
  getSessionInfo: (id) => request({ url: `/h5/customer/session/info/${id}`, method: 'GET' }),
  
  // 结束会话
  endSession: (id) => request({ url: `/h5/customer/session/end/${id}`, method: 'PUT' }),
  
  // 发送消息
  sendMessage: (data) => request({ url: '/h5/customer/message/send', method: 'POST', data }),
  
  // 获取消息列表
  getMessageList: (sessionId) => request({ url: `/h5/customer/message/list/${sessionId}`, method: 'GET' }),
  
  // 标记消息为已读
  markAsRead: (sessionId, receiverId) => request({ url: `/h5/customer/message/markAsRead/${sessionId}/${receiverId}`, method: 'PUT' }),
  
  // 获取未读消息数量
  getUnreadCount: (sessionId, receiverId) => request({ url: `/h5/customer/message/unreadCount/${sessionId}/${receiverId}`, method: 'GET' })
}

export default customerApi
