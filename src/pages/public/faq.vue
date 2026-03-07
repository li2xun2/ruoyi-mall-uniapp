<template>
  <s-layout class="set-wrap" title="常见问题" :bgStyle="{ color: '#FFF' }">
    <uni-collapse>
      <uni-collapse-item v-for="(item, index) in state.list" :key="item">
        <template v-slot:title>
          <view class="ss-flex ss-col-center header">
            <view class="ss-m-l-20 ss-m-r-20 icon">
              <view class="rectangle">
                <view class="num ss-flex ss-row-center ss-col-center">
                  {{ index + 1 < 10 ? '0' + (index + 1) : index + 1 }}
                </view>
              </view>
              <view class="triangle"> </view>
            </view>
            <view class="title ss-m-t-36 ss-m-b-36">
              {{ item.question }}
            </view>
          </view>
        </template>
        <view class="content ss-p-l-78 ss-p-r-40 ss-p-b-50 ss-p-t-20">
          <text class="text">{{ item.answer }}</text>
        </view>
      </uni-collapse-item>
    </uni-collapse>
    <s-empty
      v-if="state.list.length === 0 && !state.loading"
      text="暂无常见问题"
      icon="/static/collect-empty.png"
    />
  </s-layout>
</template>

<script setup>
  import { onLoad } from '@dcloudio/uni-app';
  import { reactive } from 'vue';
  import sheep from '@/sheep';

  const state = reactive({
    list: [],
    loading: true,
  });

  async function getFaqList() {
    console.log('开始获取FAQ列表');
    try {
      const result = await sheep.$api.data.faq();
      console.log('API调用结果:', result);
      // 后端直接返回Page对象，不是{error, data}格式
      if (result && result.content) {
        console.log('API调用成功，返回数据:', result);
        console.log('FAQ列表数据:', result.content);
        state.list = result.content;
        state.loading = false;
        console.log('最终FAQ列表:', state.list);
      } else {
        console.log('API调用失败: 返回数据格式不正确');
        state.loading = false;
      }
    } catch (error) {
      console.log('API调用异常:', error);
      state.loading = false;
    }
  }
  onLoad(() => {
    getFaqList();
  });
</script>

<style lang="scss" scoped>
  .header {
    .title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333333;
      line-height: 30rpx;
      max-width: 688rpx;
    }

    .icon {
      position: relative;
      width: 40rpx;
      height: 40rpx;

      .rectangle {
        position: absolute;
        left: 0;
        top: 0;
        width: 40rpx;
        height: 36rpx;
        background: var(--ui-BG-Main);
        border-radius: 4px;

        .num {
          width: 100%;
          height: 100%;
          font-size: 24rpx;
          font-weight: 500;
          color: var(--ui-BG);
          line-height: 32rpx;
        }
      }

      .triangle {
        width: 0;
        height: 0;
        border-left: 4rpx solid transparent;
        border-right: 4rpx solid transparent;
        border-top: 8rpx solid var(--ui-BG-Main);
        position: absolute;
        left: 16rpx;
        bottom: -4rpx;
      }
    }
  }

  .content {
    border-bottom: 1rpx solid #dfdfdf;

    .text {
      font-size: 26rpx;
      color: #666666;
    }
  }
</style>
