<template>
  <view class="exchange-record">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="navigateBack">
        <text class="nav-icon">←</text>
      </view>
      <view class="nav-title">兑换记录</view>
      <view class="nav-right"></view>
    </view>

    <!-- 加载中状态 -->
    <view v-if="loading" class="loading-state">
      <text>加载兑换记录中...</text>
    </view>

    <!-- 兑换记录列表 -->
    <view v-else class="record-list">
      <view
        v-for="record in recordList"
        :key="record.id"
        class="record-item"
      >
        <view class="record-header">
          <text class="record-goods-name">{{ record.goodsName }}</text>
          <text class="record-status" v-if="record.status === 1">兑换成功</text>
          <text class="record-status fail" v-else>兑换失败</text>
        </view>
        <view class="record-content">
          <text class="record-integral">消耗积分: {{ record.integralAmount }}</text>
          <text class="record-time">{{ formatTime(record.createTime) }}</text>
        </view>
      </view>

      <!-- 空记录提示 -->
      <view v-if="recordList.length === 0" class="empty-record">
        <view class="empty-icon">📋</view>
        <text class="empty-text">暂无兑换记录</text>
        <text class="empty-subtext">去积分商城兑换心仪的商品吧</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import activityApi from '@/sheep/api/activity';
import dayjs from "dayjs";

const recordList = ref([]);

const loading = ref(false);

// 获取兑换记录列表
const getExchangeRecordList = async () => {
  if (loading.value) return;
  
  try {
    loading.value = true;
    uni.showLoading({ title: '加载中...' });
    
    const response = await activityApi.integralExchangeList();
    
    if (!response) {
      throw new Error('获取兑换记录失败');
    }
    
    recordList.value = response.data || [];
  } catch (error) {
    console.error('获取兑换记录失败:', error);
    uni.showToast({ 
      title: error.message || '获取兑换记录失败', 
      icon: 'none',
      duration: 2000
    });
  } finally {
    loading.value = false;
    uni.hideLoading();
  }
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};

// 页面加载时获取数据
onMounted(() => {
  getExchangeRecordList();
});
</script>

<style scoped>
.exchange-record {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #fff;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left,
.nav-right {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon {
  font-size: 24px;
  color: #333;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 兑换记录列表 */
.record-list {
  margin-top: 10px;
}

.record-item {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 10px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-goods-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.record-status {
  font-size: 14px;
  color: #4CAF50;
  font-weight: 500;
}

.record-status.fail {
  color: #ff4757;
}

.record-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-integral {
  font-size: 14px;
  color: #666;
}

.record-time {
  font-size: 12px;
  color: #999;
}

/* 加载中状态 */
.loading-state {
  background-color: #fff;
  padding: 100rpx 0;
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
  color: #999;
}

/* 空记录提示 */
.empty-record {
  background-color: #fff;
  padding: 120rpx 0;
  text-align: center;
  margin-top: 10px;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-subtext {
  font-size: 28rpx;
  color: #999;
}
</style>
