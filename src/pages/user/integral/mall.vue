<template>
  <view class="integral-mall" @scrolltolower="loadMore">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="navigateBack">
        <text class="nav-icon">←</text>
      </view>
      <view class="nav-title">积分商城</view>
      <view class="nav-right"></view>
    </view>

    <!-- 积分余额 -->
    <view class="integral-balance">
      <text class="balance-label">我的积分</text>
      <text class="balance-value">{{ integralBalance }}</text>
    </view>

    <!-- 筛选和排序 -->
    <view class="filter-sort-bar">
      <view class="filter-section">
        <text class="filter-title">筛选</text>
        <view class="filter-options">
          <text 
            v-for="option in filterOptions" 
            :key="option.value"
            class="filter-option"
            :class="{ 'active': currentFilter === option.value }"
            @click="selectFilter(option.value)"
          >
            {{ option.label }}
          </text>
        </view>
      </view>
      <view class="sort-section">
        <text class="sort-title">排序</text>
        <view class="sort-options">
          <text 
            v-for="option in sortOptions" 
            :key="option.value"
            class="sort-option"
            :class="{ 'active': currentSort === option.value }"
            @click="selectSort(option.value)"
          >
            {{ option.label }}
          </text>
        </view>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="goods-list">
      <!-- 加载中状态 -->
      <view v-if="loading && goodsList.length === 0" class="loading-state">
        <text>加载商品中...</text>
      </view>
      
      <!-- 商品列表 -->
      <view v-else-if="goodsList.length > 0">
        <view
          v-for="goods in goodsList"
          :key="goods.id"
          class="goods-item"
          @click="navigateToDetail(goods.id)"
        >
          <view class="goods-image">
            <image :src="goods.imageUrl || '../../static/images/default-goods.png'" mode="aspectFill"></image>
          </view>
          <view class="goods-info">
            <text class="goods-name">{{ goods.goodsName }}</text>
            <text class="goods-description">{{ goods.description }}</text>
            <view class="goods-bottom">
              <text class="goods-price">
                <text class="price-unit">积分</text>
                <text class="price-value">{{ goods.integralPrice }}</text>
              </text>
              <text class="goods-stock" v-if="goods.stock > 0">库存: {{ goods.stock }}</text>
              <text class="goods-stock out-of-stock" v-else>库存: 已售罄</text>
            </view>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view class="load-more" v-if="loading">
          <text>加载中...</text>
        </view>
        
        <!-- 没有更多数据 -->
        <view class="no-more" v-if="!loading && !hasMore">
          <text>没有更多商品了</text>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <view class="empty-icon">🛒</view>
        <text class="empty-text">暂无商品</text>
        <text class="empty-subtext">稍后再来看看吧</text>
      </view>
    </view>

    <!-- 兑换记录入口 -->
    <view class="exchange-record-entry" @click="navigateToExchangeRecord">
      <text class="entry-text">兑换记录</text>
      <text class="entry-icon">→</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import activityApi from '@/sheep/api/activity';

const goodsList = ref([]);
const integralBalance = ref(0);
const loading = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = ref(10);

// 筛选和排序
const currentFilter = ref('all'); // all: 全部, inStock: 有库存
const currentSort = ref('default'); // default: 默认, priceAsc: 积分升序, priceDesc: 积分降序

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '有库存', value: 'inStock' }
];

const sortOptions = [
  { label: '默认', value: 'default' },
  { label: '积分升序', value: 'priceAsc' },
  { label: '积分降序', value: 'priceDesc' }
];

// 获取积分商城商品列表
const getGoodsList = async (isRefresh = false) => {
  if (loading.value) return;
  
  try {
    loading.value = true;
    if (isRefresh) {
      currentPage.value = 1;
      hasMore.value = true;
      // 显示加载中提示
      if (isRefresh) {
        uni.showLoading({ title: '加载中...' });
      }
    }
    
    // 构建请求参数
    const params = {
      page: {
        pageNumber: currentPage.value - 1,
        pageSize: pageSize.value
      },
      filter: currentFilter.value,
      sort: currentSort.value
    };
    
    const response = await activityApi.integralGoodsList(params);
    
    // 检查响应状态
    if (!response) {
      throw new Error('无效的响应数据');
    }
    
    let data = response.data || [];
    
    // 客户端筛选（如果后端不支持筛选）
    if (currentFilter.value === 'inStock') {
      data = data.filter(item => item.stock > 0);
    }
    
    // 客户端排序（如果后端不支持排序）
    if (currentSort.value === 'priceAsc') {
      data.sort((a, b) => a.integralPrice - b.integralPrice);
    } else if (currentSort.value === 'priceDesc') {
      data.sort((a, b) => b.integralPrice - a.integralPrice);
    }
    
    if (isRefresh) {
      goodsList.value = data;
    } else {
      goodsList.value = [...goodsList.value, ...data];
    }
    
    // 判断是否还有更多数据
    if (data.length < pageSize.value) {
      hasMore.value = false;
    } else {
      currentPage.value++;
    }
  } catch (error) {
    console.error('获取商品列表失败:', error);
    uni.showToast({ 
      title: error.message || '获取商品列表失败', 
      icon: 'none',
      duration: 2000
    });
  } finally {
    loading.value = false;
    uni.hideLoading();
  }
};

// 下拉刷新
const onPullDownRefresh = () => {
  getGoodsList(true);
  getIntegralBalance();
  uni.stopPullDownRefresh();
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  getGoodsList(false);
};

// 选择筛选条件
const selectFilter = (filter) => {
  if (currentFilter.value === filter) return;
  currentFilter.value = filter;
  getGoodsList(true);
};

// 选择排序方式
const selectSort = (sort) => {
  if (currentSort.value === sort) return;
  currentSort.value = sort;
  getGoodsList(true);
};

// 获取用户积分余额
const getIntegralBalance = async () => {
  try {
    const res = await activityApi.integralStat({});
    if (res && res.balance) {
      integralBalance.value = res.balance;
    }
  } catch (error) {
    console.error('获取积分余额失败:', error);
  }
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};

// 跳转到商品详情页
const navigateToDetail = (goodsId) => {
  uni.navigateTo({
    url: '/pages/user/integral/goods-detail?id=' + goodsId
  });
};

// 跳转到兑换记录页
const navigateToExchangeRecord = () => {
  uni.navigateTo({
    url: '/pages/user/integral/exchange-record'
  });
};

// 页面加载时获取数据
onMounted(() => {
  getGoodsList(true);
  getIntegralBalance();
});
</script>

<style scoped>
.integral-mall {
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

/* 积分余额 */
.integral-balance {
  background-color: #fff;
  padding: 20px;
  margin: 10px 0;
  text-align: center;
}

.balance-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.balance-value {
  font-size: 32px;
  font-weight: 600;
  color: #ff6b35;
}

/* 筛选和排序栏 */
.filter-sort-bar {
  background-color: #fff;
  padding: 12px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-section,
.sort-section {
  margin-bottom: 12px;
}

.filter-section:last-child,
.sort-section:last-child {
  margin-bottom: 0;
}

.filter-title,
.sort-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.filter-options,
.sort-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-option,
.sort-option {
  font-size: 14px;
  color: #333;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-option.active,
.sort-option.active {
  color: #ff6b35;
  border-color: #ff6b35;
  background-color: rgba(255, 107, 53, 0.1);
}

/* 商品列表 */
.goods-list {
  background-color: #fff;
  margin-bottom: 10px;
}

.goods-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.goods-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 16px;
}

.goods-image image {
  width: 100%;
  height: 100%;
}

.goods-info {
  flex: 1;
  min-width: 0;
}

.goods-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.goods-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  font-size: 18px;
  font-weight: 600;
  color: #ff6b35;
}

.price-unit {
  font-size: 14px;
  margin-right: 4px;
}

.goods-stock {
  font-size: 12px;
  color: #999;
}

.out-of-stock {
  color: #ff4757;
}

/* 兑换记录入口 */
.exchange-record-entry {
  background-color: #fff;
  padding: 16px;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.entry-text {
  font-size: 16px;
  color: #333;
}

.entry-icon {
  font-size: 16px;
  color: #999;
}

/* 加载更多和没有更多数据 */
.load-more,
.no-more {
  padding: 20px 0;
  text-align: center;
  font-size: 14px;
  color: #999;
  background-color: #fff;
}

/* 加载中状态 */
.loading-state {
  padding: 100rpx 0;
  text-align: center;
  font-size: 14px;
  color: #999;
  background-color: #fff;
}

/* 空状态 */
.empty-state {
  padding: 120rpx 0;
  text-align: center;
  background-color: #fff;
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

/* 下拉刷新样式 */
page {
  background-color: #f5f5f5;
}
</style>
