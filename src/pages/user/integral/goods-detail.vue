<template>
  <view class="goods-detail">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="navigateBack">
        <text class="nav-icon">←</text>
      </view>
      <view class="nav-title">商品详情</view>
      <view class="nav-right"></view>
    </view>

    <!-- 加载中状态 -->
    <view v-if="detailLoading" class="detail-loading">
      <text>加载商品详情中...</text>
    </view>

    <!-- 商品详情内容 -->
    <view v-else-if="Object.keys(goods).length > 0">
      <!-- 商品图片 -->
      <view class="goods-image">
        <image :src="goods.imageUrl || '../../static/images/default-goods.png'" mode="aspectFill"></image>
      </view>

      <!-- 商品信息 -->
      <view class="goods-info">
        <text class="goods-name">{{ goods.goodsName }}</text>
        <text class="goods-price">
          <text class="price-unit">积分</text>
          <text class="price-value">{{ goods.integralPrice }}</text>
        </text>
        <text class="goods-stock" v-if="goods.stock > 0">库存: {{ goods.stock }}</text>
        <text class="goods-stock out-of-stock" v-else>库存: 已售罄</text>
      </view>

      <!-- 商品描述 -->
      <view class="goods-description">
        <text class="desc-title">商品描述</text>
        <text class="desc-content">{{ goods.description || '暂无描述' }}</text>
      </view>

      <!-- 底部兑换按钮 -->
      <view class="bottom-bar">
        <view class="integral-balance">
          <text class="balance-label">我的积分</text>
          <text class="balance-value">{{ integralBalance }}</text>
        </view>
        <button
          class="exchange-btn"
          :disabled="goods.stock <= 0 || integralBalance < goods.integralPrice"
          @click="exchangeGoods"
        >
          <text v-if="goods.stock > 0 && integralBalance >= goods.integralPrice">立即兑换</text>
          <text v-else-if="goods.stock <= 0">已售罄</text>
          <text v-else>积分不足</text>
        </button>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-state">
      <view class="error-icon">⚠️</view>
      <text class="error-text">商品详情加载失败</text>
      <button class="retry-btn" @click="getGoodsDetail">重新加载</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import activityApi from '@/sheep/api/activity';

const goods = ref({});
const integralBalance = ref(0);
const loading = ref(false);
const detailLoading = ref(false);
let goodsId = '';

// 获取路由参数
onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  goodsId = currentPage.options.id;
  if (!goodsId) {
    uni.showToast({ title: '商品ID不能为空', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1000);
    return;
  }
  getGoodsDetail();
  getIntegralBalance();
});

// 获取商品详情
const getGoodsDetail = async () => {
  if (detailLoading.value) return;
  
  try {
    detailLoading.value = true;
    uni.showLoading({ title: '加载中...' });
    
    const response = await activityApi.integralGoodsDetail(goodsId);
    
    if (!response || !response.data) {
      throw new Error('获取商品详情失败');
    }
    
    goods.value = response.data;
  } catch (error) {
    console.error('获取商品详情失败:', error);
    uni.showToast({ 
      title: error.message || '获取商品详情失败', 
      icon: 'none',
      duration: 2000
    });
  } finally {
    detailLoading.value = false;
    uni.hideLoading();
  }
};

// 获取用户积分余额
const getIntegralBalance = async () => {
  try {
    const res = await activityApi.integralStat({});
    if (res && res.balance !== undefined) {
      integralBalance.value = res.balance;
    }
  } catch (error) {
    console.error('获取积分余额失败:', error);
    // 积分余额获取失败不阻止页面显示
  }
};

// 兑换商品
const exchangeGoods = async () => {
  if (goods.value.stock <= 0) {
    uni.showToast({ title: '商品已售罄', icon: 'none' });
    return;
  }

  if (integralBalance.value < goods.value.integralPrice) {
    uni.showToast({ title: '积分不足', icon: 'none' });
    return;
  }

  // 弹出确认对话框
  uni.showModal({
    title: '确认兑换',
    content: `确定要兑换「${goods.value.goodsName}」吗？\n将消耗 ${goods.value.integralPrice} 积分`,
    success: async (res) => {
      if (res.confirm) {
        if (loading.value) return;
        
        try {
          loading.value = true;
          uni.showLoading({ title: '兑换中...' });
          
          await activityApi.integralExchange({ goodsId: goodsId });
          uni.showToast({ title: '兑换成功', icon: 'success' });
          // 刷新页面数据
          getGoodsDetail();
          getIntegralBalance();
        } catch (error) {
          console.error('兑换商品失败:', error);
          uni.showToast({ 
            title: error.message || '兑换失败，请重试', 
            icon: 'none',
            duration: 2000
          });
        } finally {
          loading.value = false;
          uni.hideLoading();
        }
      }
    }
  });
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};


</script>

<style scoped>
.goods-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
  box-sizing: border-box;
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

/* 商品图片 */
.goods-image {
  width: 100%;
  height: 300px;
  background-color: #fff;
  overflow: hidden;
}

.goods-image image {
  width: 100%;
  height: 100%;
}

/* 商品信息 */
.goods-info {
  background-color: #fff;
  padding: 16px;
  margin: 10px 0;
}

.goods-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: block;
}

.goods-price {
  font-size: 24px;
  font-weight: 600;
  color: #ff6b35;
  margin-bottom: 8px;
  display: block;
}

.price-unit {
  font-size: 16px;
  margin-right: 4px;
}

.goods-stock {
  font-size: 14px;
  color: #666;
}

.out-of-stock {
  color: #ff4757;
}

/* 商品描述 */
.goods-description {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 80px;
}

.desc-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: block;
}

.desc-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* 底部兑换按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 99;
}

.integral-balance {
  flex: 1;
}

.balance-label {
  font-size: 12px;
  color: #666;
  display: block;
}

.balance-value {
  font-size: 16px;
  font-weight: 600;
  color: #ff6b35;
}

.exchange-btn {
  width: 120px;
  height: 40px;
  background-color: #ff6b35;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 500;
}

.exchange-btn:disabled {
  background-color: #ccc;
  color: #fff;
}

/* 加载中状态 */
.detail-loading {
  padding: 200rpx 0;
  text-align: center;
  font-size: 14px;
  color: #999;
  background-color: #f5f5f5;
}

/* 错误状态 */
.error-state {
  padding: 200rpx 0;
  text-align: center;
  background-color: #f5f5f5;
}

.error-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.error-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 30rpx;
}

.retry-btn {
  width: 200rpx;
  height: 60rpx;
  background-color: #ff6b35;
  color: #fff;
  border: none;
  border-radius: 30rpx;
  font-size: 28rpx;
}
</style>
