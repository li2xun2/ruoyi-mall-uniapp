<template>
  <view class="info-set-page">
    <view class="page-header">
      <view class="left-btn" @tap="sheep.$router.back()">
        <text class="sicon-back"></text>
      </view>
      <view class="title">个人信息设置</view>
      <view class="right-btn"></view>
    </view>

    <view class="content">
      <!-- 头像设置 -->
      <view class="form-item avatar-item">
        <view class="label">头像</view>
        <view class="avatar-box">
          <image :src="form.avatar || defaultAvatar" mode="aspectFill" class="avatar-img"></image>
          <view class="avatar-upload" @tap="chooseAvatar">
            <text class="sicon-camera"></text>
          </view>
        </view>
      </view>

      <!-- 昵称设置 -->
      <view class="form-item">
        <view class="label">昵称</view>
        <input v-model="form.nickname" type="text" placeholder="请输入昵称" class="input" maxlength="20" />
      </view>

      <!-- 性别设置 -->
      <view class="form-item">
        <view class="label">性别</view>
        <view class="gender-select">
          <button :class="['gender-btn', form.gender === 0 ? 'active' : '']" @tap="form.gender = 0">未知</button>
          <button :class="['gender-btn', form.gender === 1 ? 'active' : '']" @tap="form.gender = 1">男</button>
          <button :class="['gender-btn', form.gender === 2 ? 'active' : '']" @tap="form.gender = 2">女</button>
        </view>
      </view>

      <!-- 城市设置 -->
      <view class="form-item">
        <view class="label">城市</view>
        <input v-model="form.city" type="text" placeholder="请输入城市" class="input" maxlength="50" />
      </view>

      <!-- 省份设置 -->
      <view class="form-item">
        <view class="label">省份</view>
        <input v-model="form.province" type="text" placeholder="请输入省份" class="input" maxlength="50" />
      </view>

      <!-- 国家设置 -->
      <view class="form-item">
        <view class="label">国家</view>
        <input v-model="form.country" type="text" placeholder="请输入国家" class="input" maxlength="50" />
      </view>

      <!-- 生日设置 -->
      <view class="form-item">
        <view class="label">生日</view>
        <view class="birthday-picker" @tap="showBirthdayPicker">
          <text class="birthday-text">{{ form.birthday || '请选择生日' }}</text>
          <text class="sicon-arrow-right"></text>
        </view>
      </view>

      <!-- 备注设置 -->
      <view class="form-item textarea-item">
        <view class="label">备注</view>
        <textarea v-model="form.mark" placeholder="请输入备注信息" class="textarea" maxlength="200" />
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-btn-box">
      <button class="save-btn" @tap="saveInfo">保存修改</button>
    </view>

    <!-- 生日选择器 -->
    <picker-view v-if="showPicker" class="picker-view" @change="onDateChange">
      <picker-view-column>
        <view v-for="year in years" :key="year" class="picker-item">{{ year }}年</view>
      </picker-view-column>
      <picker-view-column>
        <view v-for="month in 12" :key="month" class="picker-item">{{ month }}月</view>
      </picker-view-column>
      <picker-view-column>
        <view v-for="day in days" :key="day" class="picker-item">{{ day }}日</view>
      </picker-view-column>
    </picker-view>
    <view v-if="showPicker" class="picker-mask" @tap="showPicker = false"></view>
  </view>
</template>

<script setup>
import sheep from '@/sheep';
import userApi from '@/sheep/api/user';
import { ref, onMounted, computed } from 'vue';

// 默认头像
const defaultAvatar = 'https://git-open.oss-cn-shenzhen.aliyuncs.com/ruoyi-mall/uniapp/icons/default_avatar.png';

// 表单数据
const form = ref({
  avatar: '',
  nickname: '',
  gender: 0,
  city: '',
  province: '',
  country: '',
  birthday: '',
  mark: ''
});

// 生日选择器
const showPicker = ref(false);
const years = ref([]);
const days = ref([]);
const currentDate = ref(new Date());

// 初始化年份
const initYears = () => {
  const yearList = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 100; i <= currentYear; i++) {
    yearList.push(i);
  }
  years.value = yearList;
};

// 根据年月计算天数
const updateDays = (year, month) => {
  const dayList = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dayList.push(i);
  }
  days.value = dayList;
};

// 初始化
onMounted(async () => {
  initYears();
  updateDays(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1);
  await loadUserInfo();
});

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await userApi.profile();
    if (res.code === 200) {
      const userInfo = res.data;
      form.value.avatar = userInfo.avatar || '';
      form.value.nickname = userInfo.nickname || '';
      form.value.gender = userInfo.gender || 0;
      form.value.city = userInfo.city || '';
      form.value.province = userInfo.province || '';
      form.value.country = userInfo.country || '';
      form.value.birthday = userInfo.birthday || '';
      form.value.mark = userInfo.mark || '';
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
};

// 选择头像
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths;
      console.log('选择的图片路径:', tempFilePaths);
      // 上传头像
      try {
        const uploadResult = await sheep.$api.app.upload(tempFilePaths[0]);
        console.log('上传结果:', uploadResult);
        if (uploadResult && uploadResult.url) {
          form.value.avatar = uploadResult.url;
          console.log('设置后的form.value.avatar:', form.value.avatar);
          sheep.$helper.toast('头像上传成功');
        } else {
          sheep.$helper.toast('头像上传失败');
        }
      } catch (error) {
        console.error('上传失败:', error);
        sheep.$helper.toast('上传失败，请重试');
      }
    }
  });
};

// 显示生日选择器
const showBirthdayPicker = () => {
  showPicker.value = true;
};

// 日期选择变化
const onDateChange = (e) => {
  const val = e.detail.value;
  const year = years.value[val[0]];
  const month = val[1] + 1;
  const day = days.value[val[2]];
  
  // 更新天数
  updateDays(year, month);
  
  // 格式化日期
  const formattedMonth = month.toString().padStart(2, '0');
  const formattedDay = day.toString().padStart(2, '0');
  form.value.birthday = `${year}-${formattedMonth}-${formattedDay}`;
};

// 保存修改
const saveInfo = async () => {
  try {
    console.log('保存前的form.value:', form.value);
    const res = await userApi.update(form.value);
    console.log('保存后的res:', res);
    if (res.code === 200) {
      sheep.$helper.toast('保存成功');
      // 刷新用户信息
      await loadUserInfo();
      // 返回上一页
      setTimeout(() => {
        sheep.$router.back();
      }, 1000);
    } else {
      console.error('保存失败，错误信息:', res.msg);
      sheep.$helper.toast('保存失败，请重试');
    }
  } catch (error) {
    console.error('保存失败:', error);
    sheep.$helper.toast('保存失败，请重试');
  }
};
</script>

<style lang="scss" scoped>
.info-set-page {
  min-height: 100vh;
  background-color: #f5f5f5;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100rpx;
    padding: 0 30rpx;
    padding-top: var(--status-bar-height, 0);
    background-color: #ffffff;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    min-height: calc(100rpx + var(--status-bar-height, 0));

    .left-btn,
    .right-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sicon-back {
      font-size: 32rpx;
      color: #333333;
    }

    .title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333333;
    }
  }

  .content {
    margin-top: 20rpx;
    background-color: #ffffff;

    .form-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 30rpx;
      height: 100rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 28rpx;
        color: #333333;
        width: 120rpx;
      }

      .input {
        flex: 1;
        text-align: right;
        font-size: 28rpx;
        color: #666666;
        padding-left: 30rpx;
      }
    }

    .textarea-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 0 30rpx;
      height: 180rpx;
      border-bottom: 1rpx solid #f0f0f0;

      .label {
        font-size: 28rpx;
        color: #333333;
        width: 120rpx;
        padding-top: 20rpx;
      }

      .textarea {
        flex: 1;
        height: 150rpx;
        text-align: right;
        font-size: 28rpx;
        color: #666666;
        padding-left: 30rpx;
        padding-top: 20rpx;
        border: none;
        resize: none;
      }
    }

    .avatar-item {
      height: 150rpx;

      .avatar-box {
        position: relative;
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        overflow: hidden;

        .avatar-img {
          width: 100%;
          height: 100%;
        }

        .avatar-upload {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 36rpx;
          height: 36rpx;
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;

          .sicon-camera {
            font-size: 20rpx;
            color: #ffffff;
          }
        }
      }
    }

    .gender-select {
      display: flex;
      gap: 20rpx;

      .gender-btn {
        padding: 10rpx 30rpx;
        border: 1rpx solid #e0e0e0;
        border-radius: 20rpx;
        font-size: 24rpx;
        color: #666666;
        background-color: #ffffff;

        &.active {
          border-color: #ff6100;
          color: #ff6100;
          background-color: rgba(255, 97, 0, 0.1);
        }
      }
    }

    .birthday-picker {
      display: flex;
      align-items: center;
      gap: 10rpx;

      .birthday-text {
        font-size: 28rpx;
        color: #666666;
      }

      .sicon-arrow-right {
        font-size: 24rpx;
        color: #999999;
      }
    }
  }

  .save-btn-box {
    padding: 50rpx 30rpx;

    .save-btn {
      width: 100%;
      height: 80rpx;
      background-color: #ff6100;
      color: #ffffff;
      font-size: 30rpx;
      font-weight: 500;
      border-radius: 40rpx;
    }
  }

  .picker-view {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 500rpx;
    background-color: #ffffff;
    z-index: 999;
  }

  .picker-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 998;
  }

  .picker-item {
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    font-size: 28rpx;
  }
}
</style>