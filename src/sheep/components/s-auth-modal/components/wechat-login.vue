<template>
<view>
  <view class="head-box ss-flex-col">
    <view class="form-header ss-flex">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'login' }"
        @click="activeTab = 'login'"
      >
        登录
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'register' }"
        @click="activeTab = 'register'"
      >
        注册
      </view>
    </view>
  </view>
  
  <view class="form-container">
    <!-- 登录表单 -->
    <view v-if="activeTab === 'login'" class="form-content">
      <view class="form-item">
        <view class="form-label">用户名</view>
        <input 
          v-model="loginForm.username" 
          class="form-input" 
          placeholder="请输入用户名"
          type="text"
        />
      </view>
      
      <view class="form-item">
        <view class="form-label">密码</view>
        <input 
          v-model="loginForm.password" 
          class="form-input" 
          placeholder="请输入密码"
          type="password"
        />
      </view>
      
      <button 
        class="login-btn ss-reset-button" 
        @click="handleLogin"
        :disabled="isLoading"
      >
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
    </view>
    
    <!-- 注册表单 -->
    <view v-if="activeTab === 'register'" class="form-content">
      <view class="form-item">
        <view class="form-label">用户名</view>
        <input 
          v-model="registerForm.username" 
          class="form-input" 
          placeholder="请输入用户名"
          type="text"
        />
      </view>
      
      <view class="form-item">
        <view class="form-label">密码</view>
        <input 
          v-model="registerForm.password" 
          class="form-input" 
          placeholder="请输入密码"
          type="password"
        />
      </view>
      
      <button 
        class="login-btn ss-reset-button" 
        @click="handleRegister"
        :disabled="isLoading"
      >
        {{ isLoading ? '注册中...' : '注册' }}
      </button>
    </view>
    
    <button 
      class="cancel-btn ss-reset-button" 
      @tap="closeAuthModal"
    >
      取消
    </button>
  </view>
</view>
</template>

<script setup>
import { ref, reactive } from "vue";
import sheep from '@/sheep';
import { closeAuthModal } from '@/sheep/hooks/useModal';
import userApi from '@/sheep/api/user';

const activeTab = ref('login');
const isLoading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const registerForm = reactive({
  username: '',
  password: ''
});

const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      uni.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    isLoading.value = true;
    try {
      const res = await userApi.accountLogin({
        mobile: loginForm.username,
        password: loginForm.password
      });
      
      if (res.code === 200) {
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        });
        // 兜底：若拦截器未及时写入 token，这里手动写入，避免后续 getInfo 被拦截
        const token =
          res?.token ||
          res?.data?.token ||
          res?.data?.data?.token ||
          (typeof res?.data === 'string' ? res.data : null);
        if (token) {
          sheep.$store('user').setToken(token);
        }
        // 登录成功后获取用户信息
        sheep.$store('user').getInfo();
        closeAuthModal();
      } else {
        uni.showToast({
          title: res.msg || '登录失败',
          icon: 'none'
        });
      }
    } catch (error) {
      uni.showToast({
        title: '登录异常，请稍后重试',
        icon: 'none'
      });
      console.error('登录错误:', error);
    } finally {
      isLoading.value = false;
    }
  };

const handleRegister = async () => {
    if (!registerForm.username || !registerForm.password) {
      uni.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    isLoading.value = true;
    try {
      // 调用账号注册接口
      const res = await userApi.accountRegister({
        mobile: registerForm.username,
        password: registerForm.password
      });
      
      if (res.code === 200) {
        uni.showToast({
          title: '注册成功',
          icon: 'success'
        });
        // 注册成功后切换到登录标签
        activeTab.value = 'login';
        // 填充登录表单
        loginForm.username = registerForm.username;
        loginForm.password = registerForm.password;
      } else {
        uni.showToast({
          title: res.msg || '注册失败',
          icon: 'none'
        });
      }
    } catch (error) {
      uni.showToast({
        title: '注册异常，请稍后重试',
        icon: 'none'
      });
      console.error('注册错误:', error);
    } finally {
      isLoading.value = false;
    }
  };

</script>


<style lang="scss" scoped>
.head-box {
  text-align: center;
  margin-bottom: 40rpx;
}

.form-header {
  display: flex;
  margin-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #409eff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1rpx;
  left: 25%;
  width: 50%;
  height: 3rpx;
  background-color: #409eff;
}

.form-container {
  padding: 0 20rpx;
}

.form-content {
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 24rpx;
  background-color: #fafafa;
}

.form-input:focus {
  border-color: #409eff;
  background-color: #fff;
}

.login-btn {
  width: 100%;
  height: 80rpx;
  background-color: #409eff;
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.login-btn:hover {
  background-color: #66b1ff;
}

.login-btn:active {
  background-color: #3a8ee6;
}

.login-btn:disabled {
  background-color: #c6e2ff;
  color: #fff;
}

.cancel-btn {
  width: 100%;
  height: 80rpx;
  background-color: #f5f5f5;
  color: #666;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 8rpx;
}

.cancel-btn:hover {
  background-color: #e8e8e8;
}

.cancel-btn:active {
  background-color: #d9d9d9;
}
</style>
