<template>
  <s-layout title="AI客服" class="ai-service-wrap">
    <!-- 聊天内容区 -->
    <scroll-view 
      class="chat-content" 
      scroll-y 
      :scroll-top="scrollTop"
      @scroll="onScroll"
    >
      <!-- 欢迎消息 -->
      <view v-if="messages.length === 0" class="welcome-message">
        <image 
          class="ai-avatar" 
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20customer%20service%20robot%20icon%20blue%20simple%20style&image_size=square" 
        />
        <text class="welcome-text">您好！我是AI客服助手，有什么可以帮您的吗？</text>
        <view class="quick-questions">
          <button 
            v-for="(question, index) in quickQuestions" 
            :key="index" 
            class="quick-question-btn"
            @tap="sendQuickQuestion(question)"
          >
            {{ question }}
          </button>
        </view>
      </view>
      
      <!-- 聊天消息 -->
      <view 
        v-for="(msg, index) in messages" 
        :key="index" 
        :class="['message-item', msg.type === 'user' ? 'user-message' : 'ai-message']"
      >
        <!-- 用户消息 -->
        <view v-if="msg.type === 'user'" class="user-message-content">
          <view class="message-bubble user-bubble">
            <text class="message-text">{{ msg.content }}</text>
          </view>
          <image 
            class="user-avatar" 
            :src="userInfo.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20icon%20simple%20style&image_size=square'" 
          />
        </view>
        
        <!-- AI消息 -->
        <view v-else class="ai-message-content">
          <image 
            class="ai-avatar" 
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20customer%20service%20robot%20icon%20blue%20simple%20style&image_size=square" 
          />
          <view class="message-bubble ai-bubble">
            <text class="message-text">{{ msg.content }}</text>
            <view v-if="msg.confidence < 0.7" class="confidence-indicator">
              <text class="confidence-text">AI生成内容，仅供参考</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载中 -->
      <view v-if="loading" class="loading-message">
        <image 
          class="loading-avatar" 
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20customer%20service%20robot%20icon%20blue%20simple%20style&image_size=square" 
        />
        <view class="loading-bubble">
          <text class="loading-text">AI正在思考...</text>
          <view class="loading-dots">
            <view class="dot"></view>
            <view class="dot"></view>
            <view class="dot"></view>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 输入区域 -->
    <view class="input-area">
      <input 
        v-model="inputText" 
        placeholder="请输入您的问题" 
        class="input" 
        @confirm="sendMessage"
      />
      <button 
        @click="sendMessage" 
        class="send-btn"
        :disabled="!inputText.trim()"
      >
        <text class="send-icon">发送</text>
      </button>
    </view>
  </s-layout>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import sheep from '@/sheep';
  
  // 响应式数据
  const messages = ref([]);
  const inputText = ref('');
  const loading = ref(false);
  const scrollTop = ref(0);
  const scrollHeight = ref(0);
  
  // 快速问题
  const quickQuestions = [
    '我的订单什么时候发货？',
    '如何申请退款？',
    '如何修改收货地址？',
    '优惠券如何使用？'
  ];
  
  // 用户信息
  const userInfo = computed(() => sheep.$store('user').userInfo);
  
  // 发送快速问题
  function sendQuickQuestion(question) {
    inputText.value = question;
    sendMessage();
  }
  
  // 发送消息
  function sendMessage() {
    const text = inputText.value.trim();
    if (!text) return;
    
    // 添加用户消息
    messages.value.push({
      type: 'user',
      content: text,
      timestamp: new Date().getTime()
    });
    
    inputText.value = '';
    loading.value = true;
    
    // 添加AI消息占位符
    const aiMessageIndex = messages.value.length;
    messages.value.push({
      type: 'ai',
      content: '',
      confidence: 0,
      timestamp: new Date().getTime(),
      streaming: true
    });
    
    // 滚动到底部
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // 调用AI服务API
    sheep.$api.ai.chat({
      question: text
    }).then(res => {
      // 更新AI消息
      messages.value[aiMessageIndex].content = res.answer || '抱歉，系统暂时无法处理您的问题，请稍后再试。';
      messages.value[aiMessageIndex].confidence = res.confidence || 0;
      messages.value[aiMessageIndex].streaming = false;
      loading.value = false;
      // 滚动到底部
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }).catch(error => {
      console.error('AI服务请求失败:', error);
      // 更新错误消息
      messages.value[aiMessageIndex].content = '抱歉，系统暂时无法处理您的问题，请稍后再试。';
      messages.value[aiMessageIndex].streaming = false;
      loading.value = false;
      // 滚动到底部
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });
  }
  
  // 滚动到底部
  function scrollToBottom() {
    uni.createSelectorQuery()
      .select('.chat-content')
      .fields({ scrollSize: true })
      .exec(res => {
        if (res[0]) {
          scrollHeight.value = res[0].scrollHeight;
          scrollTop.value = scrollHeight.value;
        }
      });
  }
  
  // 滚动事件
  function onScroll(e) {
    scrollTop.value = e.detail.scrollTop;
  }
  
  // 监听消息变化，自动滚动
  watch(messages, () => {
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, { deep: true });
  
  // 页面挂载
  onMounted(() => {
    // 初始化
    console.log('AI客服页面初始化');
  });
</script>

<style lang="scss" scoped>
  .ai-service-wrap {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .chat-content {
    flex: 1;
    padding: 20rpx;
    background-color: #f5f5f5;
    overflow-y: auto;
  }
  
  .welcome-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 20rpx;
    background-color: white;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  }
  
  .ai-avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 30rpx;
    margin-bottom: 20rpx;
  }
  
  .welcome-text {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 30rpx;
    text-align: center;
  }
  
  .quick-questions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12rpx;
  }
  
  .quick-question-btn {
    padding: 12rpx 24rpx;
    background-color: #f0f0f0;
    border-radius: 20rpx;
    font-size: 24rpx;
    color: #666;
    border: none;
    line-height: normal;
  }
  
  .message-item {
    margin-bottom: 24rpx;
    display: flex;
  }
  
  .user-message {
    justify-content: flex-end;
  }
  
  .ai-message {
    justify-content: flex-start;
  }
  
  .user-message-content {
    display: flex;
    align-items: flex-end;
    gap: 12rpx;
  }
  
  .ai-message-content {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
  }
  
  .user-avatar {
    width: 48rpx;
    height: 48rpx;
    border-radius: 24rpx;
  }
  
  .message-bubble {
    max-width: 70%;
    padding: 16rpx 20rpx;
    border-radius: 16rpx;
    line-height: 1.4;
  }
  
  .user-bubble {
    background-color: var(--ui-BG-Main);
    border-bottom-right-radius: 4rpx;
  }
  
  .ai-bubble {
    background-color: white;
    border-bottom-left-radius: 4rpx;
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.05);
  }
  
  .message-text {
    font-size: 28rpx;
    color: #333;
  }
  
  .user-bubble .message-text {
    color: white;
  }
  
  .confidence-indicator {
    margin-top: 8rpx;
    padding-top: 8rpx;
    border-top: 1rpx solid #f0f0f0;
  }
  
  .confidence-text {
    font-size: 20rpx;
    color: #999;
  }
  
  .loading-message {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-bottom: 24rpx;
  }
  
  .loading-avatar {
    width: 48rpx;
    height: 48rpx;
    border-radius: 24rpx;
  }
  
  .loading-bubble {
    background-color: white;
    padding: 16rpx 20rpx;
    border-radius: 16rpx;
    border-bottom-left-radius: 4rpx;
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.05);
  }
  
  .loading-text {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 8rpx;
  }
  
  .loading-dots {
    display: flex;
    gap: 8rpx;
  }
  
  .dot {
    width: 8rpx;
    height: 8rpx;
    background-color: var(--ui-BG-Main);
    border-radius: 4rpx;
    animation: pulse 1.4s infinite ease-in-out both;
  }
  
  .dot:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  .dot:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  @keyframes pulse {
    0%, 80%, 100% {
      transform: scale(0);
    } 40% {
      transform: scale(1);
    }
  }
  
  .input-area {
    display: flex;
    align-items: center;
    padding: 16rpx 20rpx;
    background-color: white;
    border-top: 1rpx solid #f0f0f0;
    gap: 12rpx;
  }
  
  .input {
    flex: 1;
    height: 60rpx;
    padding: 0 20rpx;
    background-color: #f5f5f5;
    border-radius: 30rpx;
    font-size: 28rpx;
    color: #333;
  }
  
  .send-btn {
    width: 100rpx;
    height: 60rpx;
    background-color: var(--ui-BG-Main);
    border-radius: 30rpx;
    font-size: 28rpx;
    color: white;
    border: none;
    line-height: 60rpx;
  }
  
  .send-btn:disabled {
    background-color: #ccc;
  }
  
  .send-icon {
    font-size: 28rpx;
  }
</style>
