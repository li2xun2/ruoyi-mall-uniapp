<template>
  <s-layout :title="state.model.id ? '编辑地址' : '新增地址'">
    <uni-forms
        ref="addressFormRef"
        v-model="state.model"
        :rules="state.rules"
        validateTrigger="bind"
        labelWidth="160"
        labelAlign="left"
        border
        :labelStyle="{ fontWeight: 'bold' }"
    >
      <view class="bg-white form-box ss-p-x-30">
        <uni-forms-item name="name" label="收货人" class="form-item">
          <uni-easyinput
              v-model="state.model.name"
              placeholder="请填写收货人姓名"
              :inputBorder="false"
              placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
          />
        </uni-forms-item>

        <uni-forms-item name="phone" label="手机号" class="form-item">
          <uni-easyinput
              v-model="state.model.phone"
              type="number"
              placeholder="请输入手机号"
              :inputBorder="false"
              placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
          >
          </uni-easyinput>
        </uni-forms-item>
        <uni-forms-item
            name="province"
            label="省份"
            class="form-item"
        >
          <uni-easyinput
              v-model="state.model.province"
              :inputBorder="false"
              placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
              placeholder="请输入省份"
          >
          </uni-easyinput>
        </uni-forms-item>
        <uni-forms-item
            name="city"
            label="城市"
            class="form-item"
        >
          <uni-easyinput
              v-model="state.model.city"
              :inputBorder="false"
              placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
              placeholder="请输入城市"
          >
          </uni-easyinput>
        </uni-forms-item>
        <uni-forms-item
            name="district"
            label="区县"
            class="form-item"
        >
          <uni-easyinput
              v-model="state.model.district"
              :inputBorder="false"
              placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
              placeholder="请输入区县"
          >
          </uni-easyinput>
        </uni-forms-item>
        <uni-forms-item
            name="detailAddress"
            label="详细地址"
            :formItemStyle="{ alignItems: 'flex-start' }"
            :labelStyle="{ lineHeight: '5em' }"
            class="textarea-item"
        >
          <uni-easyinput
              :inputBorder="false"
              type="textarea"
              v-model="state.model.detailAddress"
              placeholderStyle="color:#BBBBBB;font-size:30rpx;font-weight:400;line-height:normal"
              placeholder="请输入详细地址"
              clearable
          ></uni-easyinput>
        </uni-forms-item>
      </view>

      <view class="ss-m-y-20 bg-white ss-p-x-30 ss-flex ss-row-between ss-col-center default-box">
        <view class="default-box-title"> 设为默认地址 </view>
        <su-switch style="transform: scale(0.8)" v-model="state.model.isDefault"></su-switch>
      </view>
    </uni-forms>
    <su-fixed bottom :opacity="false" bg="" placeholder :noFixed="false" :index="10">
      <view class="footer-box ss-flex-col ss-row-between ss-p-20">
        <view class="ss-m-b-20"
        ><button class="ss-reset-button save-btn ui-Shadow-Main" @tap="onSave">保存</button></view
        >
        <button v-if="state.model.id" class="ss-reset-button cancel-btn" @tap="onDelete">
          删除
        </button>
      </view>
    </su-fixed>
    
  </s-layout>
</template>

<script setup>
import { computed, watch, ref, reactive, unref } from 'vue';
import sheep from '@/sheep';
import { onLoad, onPageScroll } from '@dcloudio/uni-app';
import _ from 'lodash';
import { name, phone, detailAddress } from '@/sheep/validate/form';

const addressFormRef = ref(null);
const state = reactive({
  model: {
    name: '',
    phone: '',
    detailAddress: '',
    is_default: false,
    province: '',
    city: '',
    district: '',
  },
  rules: {
    name,
    phone,
    detailAddress,
  },
});
const currentRole = computed(() => sheep.$store("user").currentRole);


const onSave = async () => {
  const validate = await unref(addressFormRef)
      .validate()
      .catch((error) => {
        console.log('error: ', error);
      });
  if (!validate) return;

  let res = null;
  const params = {...state.model}
  params.isDefault = params.isDefault ? 1: 0
  
  if (state.model.id) {
    res = await sheep.$api.user.address.update(params);
  } else {
    res = await sheep.$api.user.address.create(params);
  }
  if (res > 0) {
    // 获取当前页面栈
    const pages = getCurrentPages();
    // 如果页面栈长度大于1，则返回上一页，否则跳转到地址列表页面
    if (pages.length > 1) {
      sheep.$router.back();
    } else {
      sheep.$router.go('/pages/user/address/list');
    }
  }
};

const onDelete = () => {
  uni.showModal({
    title: '提示',
    content: '确认删除此收货地址吗？',
    success: async function (res) {
      if (res.confirm) {
        await sheep.$api.user.address.delete(state.model.id);
        // 获取当前页面栈
        const pages = getCurrentPages();
        // 如果页面栈长度大于1，则返回上一页，否则跳转到地址列表页面
        if (pages.length > 1) {
          sheep.$router.back();
        } else {
          sheep.$router.go('/pages/user/address/list');
        }
      }
    },
  });
};
onLoad(async (options) => {
  if (options.id) {
    let res;
    res = await sheep.$api.user.address.detail(options.id);
    state.model = {
      ...state.model,
      ...res,
    };
  }

  if (options.data) {
    let data = JSON.parse(options.data);
    state.model = {
      ...state.model,
      ...data,
    };
  }
});
</script>

<style lang="scss" scoped>
:deep() {
  .uni-forms-item__label .label-text {
    font-size: 28rpx !important;
    color: #333333 !important;
    line-height: normal !important;
  }

  .uni-easyinput__content-input {
    font-size: 28rpx !important;
    color: #333333 !important;
    line-height: normal !important;
    padding-left: 0 !important;
  }

  .uni-easyinput__content-textarea {
    font-size: 28rpx !important;
    color: #333333 !important;
    line-height: normal !important;
    margin-top: 8rpx !important;
  }

  .uni-icons {
    font-size: 40rpx !important;
  }

  .is-textarea-icon {
    margin-top: 22rpx;
  }

  .is-disabled {
    color: #333333;
  }
}

.default-box {
  width: 100%;
  box-sizing: border-box;
  height: 100rpx;

  .default-box-title {
    font-size: 28rpx;
    color: #333333;
    line-height: normal;
  }
}

.footer-box {
  .save-btn {
    width: 710rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background: linear-gradient(90deg, var(--ui-BG-Main), var(--ui-BG-Main-gradient));
    color: $white;
  }

  .cancel-btn {
    width: 710rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background: var(--ui-BG);
  }
}
</style>
