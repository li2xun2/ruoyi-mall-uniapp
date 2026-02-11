<!-- 积分页面 -->
<template>
  <s-layout title="我的积分">
    <view class="integral-wrap">
      <!-- 积分余额 -->
      <view class="balance-box">
        <view class="balance-title">当前积分</view>
        <view class="balance-value">{{ currentIntegral }}</view>
      </view>

      <!-- 积分变动记录 -->
      <view class="history-box">
        <view class="history-title">积分变动记录</view>
        <view class="history-list" v-if="historyList.length > 0">
          <view v-for="item in historyList" :key="item.id" class="history-item">
            <view class="history-info">
              <view class="history-reason">{{ getReasonText(item.opType, item.subOpType) }}</view>
              <view class="history-time">{{ formatTime(item.createTime) }}</view>
            </view>
            <view class="history-integral" :class="{ 'increase': item.opType === 1 }">
              {{ item.opType === 1 ? '+' : '-' }}{{ item.amount }}
            </view>
          </view>
        </view>
        <view v-else class="empty-box">
          <s-empty text="暂无积分变动记录" />
        </view>
      </view>
    </view>
  </s-layout>
</template>

<script setup>
import sheep from '@/sheep';
import { onReady, onLoad, reactive, ref } from 'vue';
import dayjs from "dayjs";

const currentIntegral = ref(0);
const historyList = ref([]);
const loading = ref(false);

// 格式化时间
function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
}

// 获取积分变动原因文本
function getReasonText(opType, subOpType) {
  if (opType === 1) {
    if (subOpType === 11) {
      return '签到获得积分';
    } else if (subOpType === 12) {
      return '消费获得积分';
    }
  } else if (opType === 2) {
    if (subOpType === 21) {
      return '退款扣除积分';
    } else if (subOpType === 22) {
      return '兑换商品扣除积分';
    }
  }
  return '其他变动';
}

// 获取积分统计
async function getIntegralStat() {
  try {
    const res = await sheep.$api.activity.integralStat({});
    if (res && res.balance) {
      currentIntegral.value = res.balance;
    }
  } catch (error) {
    console.error('获取积分统计失败:', error);
  }
}

// 获取积分变动历史
async function getIntegralHistory() {
  try {
    loading.value = true;
    const res = await sheep.$api.activity.integralHistoryList({
      page: {
        pageNumber: 0,
        pageSize: 20
      }
    });
    if (res && res.content) {
      historyList.value = res.content;
    }
  } catch (error) {
    console.error('获取积分变动历史失败:', error);
  } finally {
    loading.value = false;
  }
}

// 页面加载时获取数据
onLoad(() => {
  getIntegralStat();
  getIntegralHistory();
});

// 下拉刷新
function onPullDownRefresh() {
  getIntegralStat();
  getIntegralHistory();
  uni.stopPullDownRefresh();
}
</script>

<style scoped>
.integral-wrap {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.balance-box {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 40rpx;
  border-radius: 16rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.balance-title {
  font-size: 32rpx;
  margin-bottom: 20rpx;
  opacity: 0.9;
}

.balance-value {
  font-size: 64rpx;
  font-weight: bold;
  letter-spacing: 2rpx;
}

.history-box {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.history-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
  border-bottom: 1rpx solid #f0f0f0;
  padding-bottom: 20rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  flex: 1;
}

.history-reason {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.history-time {
  font-size: 24rpx;
  color: #999;
}

.history-integral {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff4d4f;
  min-width: 120rpx;
  text-align: right;
}

.history-integral.increase {
  color: #52c41a;
}

.empty-box {
  padding: 100rpx 0;
  text-align: center;
}

/* 下拉刷新样式 */
page {
  background-color: #f5f5f5;
}
</style>