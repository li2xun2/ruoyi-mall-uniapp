<template>
  <view class="customer-service">
    <!-- 头部 -->
    <view class="header">
      <view class="back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="title">客服聊天</view>
      <view class="right" @click="endSession">
        <text class="end-btn">结束会话</text>
      </view>
    </view>

    <!-- 消息列表 -->
    <view class="message-list" ref="messageList">
      <view 
        v-for="message in messageList" 
        :key="message.id"
        class="message-item"
        :class="{ 'message-sent': message.senderType === 0, 'message-received': message.senderType === 1 }"
      >
        <view class="message-content">
          <view class="message-text">{{ message.content }}</view>
          <view class="message-time">{{ formatTime(message.createTime) }}</view>
        </view>
      </view>
    </view>

    <!-- 输入框 -->
    <view class="input-container">
      <input 
        v-model="inputMessage" 
        type="text" 
        placeholder="请输入消息" 
        class="input"
        @keyup.enter="sendMessage"
      />
      <button class="send-btn" @click="sendMessage">发送</button>
    </view>
  </view>
</template>

<script>
import customerApi from '../../sheep/api/customer'

export default {
  data() {
    return {
      sessionId: '',
      userId: '',
      customerId: 1, // 默认客服ID
      messageList: [],
      inputMessage: '',
      pollingInterval: null // 轮询定时器
    }
  },
  onLoad() {
    this.userId = uni.getStorageSync('userId') || 1
    this.initSession()
  },
  
  onUnload() {
    this.stopPolling() // 页面卸载时停止轮询
  },
  methods: {
    // 初始化会话
    initSession() {
      customerApi.createSession({ userId: this.userId, customerId: this.customerId })
        .then(res => {
          if (res.code === 200) {
            this.sessionId = res.data.id
            this.loadMessageList()
            this.startPolling() // 开始轮询
          }
        })
    },
    
    // 开始轮询
    startPolling() {
      // 清除之前的定时器
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }
      // 每3秒轮询一次
      this.pollingInterval = setInterval(() => {
        this.loadMessageList()
      }, 3000)
    },
    
    // 停止轮询
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    },
    
    // 加载消息列表
    loadMessageList() {
      if (this.sessionId) {
        customerApi.getMessageList(this.sessionId)
          .then(res => {
            if (res.code === 200) {
              this.messageList = res.data
              this.scrollToBottom()
            }
          })
      }
    },
    
    // 发送消息
    sendMessage() {
      if (!this.inputMessage.trim()) return
      const message = {
        sessionId: this.sessionId,
        senderType: 0, // 0-用户
        senderId: this.userId,
        receiverId: this.customerId,
        content: this.inputMessage,
        messageType: 0 // 0-文本
      }
      customerApi.sendMessage(message)
        .then(res => {
          if (res.code === 200) {
            this.inputMessage = ''
            this.loadMessageList()
          }
        })
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const messageList = this.$refs.messageList
        if (messageList) {
          messageList.scrollTop = messageList.scrollHeight
        }
      })
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString()
    },
    
    // 返回
    goBack() {
      uni.navigateBack()
    },
    
    // 结束会话
    endSession() {
      if (this.sessionId) {
        uni.showModal({
          title: '结束会话',
          content: '确定要结束当前会话吗？',
          success: (res) => {
            if (res.confirm) {
              customerApi.endSession(this.sessionId)
                .then(res => {
                  if (res.code === 200) {
                    this.stopPolling() // 停止轮询
                    uni.showToast({
                      title: '会话已结束',
                      icon: 'success'
                    })
                    setTimeout(() => {
                      uni.navigateBack()
                    }, 1000)
                  }
                })
            }
          }
        })
      }
    }
  }
}
</script>

<style scoped>
.customer-service {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  padding: 0 15px;
}

.back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
}

.icon {
  font-size: 20px;
  color: #333333;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.right {
  width: 80px;
  text-align: right;
}

.end-btn {
  font-size: 14px;
  color: #ff4d4f;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.message-item {
  margin-bottom: 15px;
  display: flex;
}

.message-sent {
  justify-content: flex-end;
}

.message-received {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 10px;
}

.message-sent .message-content {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 0;
}

.message-received .message-content {
  background-color: #ffffff;
  border-bottom-left-radius: 0;
  border: 1px solid #e5e5e5;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 5px;
}

.message-time {
  font-size: 12px;
  text-align: right;
  opacity: 0.6;
}

.input-container {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #ffffff;
  border-top: 1px solid #e5e5e5;
}

.input {
  flex: 1;
  height: 40px;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  padding: 0 15px;
  font-size: 14px;
  margin-right: 10px;
}

.send-btn {
  width: 60px;
  height: 40px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
}
</style>
