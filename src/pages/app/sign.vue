<!-- 页面  -->
<template>
  <s-layout title="签到有礼">
    <view>
      <view class="sign-wrap" v-if="state.rules.signStatus">
        <!-- 签到日历 -->
        <view class="content-box calendar">
          <!-- 切换年月 -->
          <view class="bar ss-flex ss-col-center ss-row-center">
            <view class="previous" @tap="handleCalendar(-1)"><text class="cicon-back"></text></view>
            <view class="date ss-m-x-20"
            >{{ state.cur_year || '--' }} 年 {{ state.cur_month || '--' }} 月</view
            >
            <view class="next" @tap="handleCalendar(1)"><text class="cicon-forward"></text></view>
          </view>

          <!-- 显示星期 -->
          <view class="week ss-flex">
            <view
                class="week-item ss-flex ss-row-center"
                v-for="(item, index) in state.weeks_ch"
                :key="index"
            >
              {{ item.title }}
            </view>
          </view>

          <!-- 日历表 -->
          <view class="myDateTable">
            <view
                v-for="(item, j) in state.data.days"
                :key="j"
                class="dateCell ss-flex ss-row-center ss-col-center"
            >
              <!-- 空格 -->
              <view class="ss-flex ss-row-center ss-col-center">
                <text :decode="true">&nbsp;&nbsp;</text>
              </view>
              <view>
                <!-- 已签到日期 -->
                <view v-if="item.is_sign" class="is-sign ss-flex ss-row-center">
                  <view class="is-sign-num">{{ item.day < 10 ? '0' + item.day : item.day }}</view>
                  <view class="is-sign-mark">✓</view>
                </view>
                <!-- 未签到日期 -->
                <view
                    class="is-sign ss-flex ss-row-center"
                    v-if="!item.is_sign && item.day"
                >
                  <view class="cell-num">{{ item.day < 10 ? '0' + item.day : item.day }}</view>
                </view>
              </view>
            </view>

            <!-- 签到按钮 -->
            <view class="ss-flex ss-col-center ss-row-center sign-box ss-m-y-40">
              <button class="ss-reset-button sign-btn" v-if="state.isSign === 0" @tap="onSign"
              >签到</button
              >
              <button class="ss-reset-button already-btn" v-if="state.isSign === 1" disabled
              >已签到</button
              >
            </view>
            
            <!-- 补签按钮 -->
            <view class="ss-flex ss-col-center ss-row-center ss-m-b-40">
              <button class="ss-reset-button replenish-btn" @tap="showReplenishDialog"
              >补签</button
              >
            </view>
          </view>
        </view>
        <view class="bg-white ss-m-t-16 ss-p-t-30 ss-p-b-60 ss-p-x-40">
          <view class="activity-title ss-m-b-30">签到说明</view>
          <view class="activity-des">
            每日签到固定 {{ state.rules.signCount }} 积分
          </view>
        </view>
      </view>
      <s-empty
          v-else
          icon="/static/data-empty.png"
          text="签到活动还未开始"
      />
    </view>

    <su-popup :show="state.showModel" type="center" round="10" :isMaskClick="false">
      <view class="model-box ss-flex-col">
        <view class="ss-m-t-56 ss-flex-col ss-col-center">
          <text class="cicon-check-round"></text>
          <view class="score-title">{{ state.signin.score }}积分</view>
        </view>
        <view class="model-bg ss-flex-col ss-col-center ss-row-right">
          <view class="title ss-m-b-64">签到成功</view>
          <view class="ss-m-b-40">
            <button class="ss-reset-button confirm-btn" @tap="onConfirm">确认</button>
          </view>
        </view>
      </view>
    </su-popup>
    
    <!-- 补签弹窗 -->
    <su-popup :show="state.showReplenishModel" type="center" round="10" :isMaskClick="false">
      <view class="model-box ss-flex-col">
        <view class="ss-m-t-56 ss-flex-col ss-col-center">
          <text class="cicon-calendar"></text>
          <view class="title ss-m-t-20">补签</view>
        </view>
        <view class="model-bg ss-flex-col ss-col-center ss-row-right">
          <view class="ss-m-b-40">
            <view class="ss-m-b-20">选择要补签的日期：</view>
            <view class="replenish-days ss-flex ss-flex-wrap">
              <view 
                v-for="day in state.replenishDays" 
                :key="day" 
                class="replenish-day-item" 
                :class="{'replenish-day-selected': state.selectedReplenishDays.includes(day)}"
                @tap="selectReplenishDay(day)"
              >
                {{ day }}
              </view>
            </view>
          </view>
          <view class="ss-flex ss-row-center ss-m-b-40">
            <button class="ss-reset-button cancel-btn" @tap="closeReplenishDialog">取消</button>
            <button class="ss-reset-button confirm-btn ss-m-l-20" @tap="onReplenish">确认补签</button>
          </view>
        </view>
      </view>
    </su-popup>
  </s-layout>
</template>

<script setup>
import sheep from '@/sheep';
import {onReady} from '@dcloudio/uni-app';
import {nextTick, reactive, ref} from 'vue';
import dayjs from "dayjs";

  const headerBg = sheep.$url.css('/icons/sign1.png')
  const state = reactive({
    data: {
      days: [], //日历
    },
    rules: {signCount: 1,signStatus: 1},
    // 初始化为当前年月，避免首次请求/渲染出现 0
    cur_year: dayjs().format('YYYY'), //当前选的年
    cur_month: dayjs().format('MM'), //当前选的月（两位）
    cur_day: dayjs().date(), //当前选择的天
    weeks_ch: [
      {
        title: '日',
        value: '0',
      },
      {
        title: '一',
        value: '1',
      },
      {
        title: '二',
        value: '2',
      },
      {
        title: '三',
        value: '3',
      },
      {
        title: '四',
        value: '4',
      },
      {
        title: '五',
        value: '5',
      },
      {
        title: '六',
        value: '6',
      },
    ], //星期
    showModel: false, //签到弹框
    showReplenishModel: false, //补签弹框
    signin: {}, // 签到
    replenishDays: [], //可补签的日期
    selectedReplenishDays: [], //用户选择的补签日期
    isSign: 0, //今天是否签到
    loading: true,
  });
  async function onSign() {
    const res = await sheep.$api.activity.signAdd({amount: state.rules.signCount});
    if (res) {
      state.showModel = true;
      state.signin = {score: state.rules.signCount};
    } else {
      // 签到失败，可能是重复签到
      uni.showToast({
        title: '今日已签到',
        icon: 'none',
        duration: 2000
      });
    }
  }

  //签到确认刷新页面
  function onConfirm() {
    state.showModel = false;
    handleCalendar(0)
  }
  
  // 显示补签弹窗
  function showReplenishDialog() {
    // 计算可补签的日期（最近7天内的未签到日期）
    const today = dayjs();
    const replenishDays = [];
    
    // 检查最近7天的签到状态
    for (let i = 1; i <= 7; i++) {
      const date = today.subtract(i, 'day');
      const day = date.date();
      const found = state.data.days.find(item => item.day === day && item.is_sign === 1);
      if (!found) {
        replenishDays.push(day);
      }
    }
    
    state.replenishDays = replenishDays;
    state.selectedReplenishDays = [];
    state.showReplenishModel = true;
  }
  
  // 关闭补签弹窗
  function closeReplenishDialog() {
    state.showReplenishModel = false;
  }
  
  // 选择补签日期
  function selectReplenishDay(day) {
    const index = state.selectedReplenishDays.indexOf(day);
    if (index > -1) {
      // 取消选择
      state.selectedReplenishDays.splice(index, 1);
    } else {
      // 选择日期
      state.selectedReplenishDays.push(day);
    }
    console.log('选择补签日期:', state.selectedReplenishDays);
  }
  
  // 执行补签操作
  async function onReplenish() {
    if (state.selectedReplenishDays.length === 0) {
      uni.showToast({
        title: '请选择要补签的日期',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 这里可以实现补签逻辑
    const res = await sheep.$api.activity.replenish({days: state.selectedReplenishDays});
    if (res) {
      uni.showToast({
        title: '补签成功',
        icon: 'success',
        duration: 2000
      });
      state.showReplenishModel = false;
      handleCalendar(0);
    }
  }

  // 初始化天数（按指定年月，而不是“相对当前月偏移量”）
  // month: 'YYYY-MM' 字符串；不传则默认当前月
  function initDays(month) {
    const today = dayjs(dayjs().format('YYYY-MM-DD'));
    const monthStr = month || dayjs().format('YYYY-MM');
    const current = dayjs(`${monthStr}-01`);
    const year = current.year();
    const monthNum = current.month() + 1;
    const days = current.daysInMonth();
    const list = [];
    
    // 获取当月第一天是星期几
    const firstDayWeek = current.day();
    
    // 添加空白天数（第一行前面的空格）
    for (let i = 0; i < firstDayWeek; i++) {
      list.push({
        day: null,
        is_sign: false,
        current: 'before',
        date: null
      })
    }
    
    // 添加当月天数
    for (let i = 0; i < days; i++) {
      const date = year + '-' + (monthNum > 9 ? monthNum : '0' + monthNum) + '-' + (i > 8 ? i + 1 : '0' + (i + 1));
      const now = dayjs(date);
      list.push({
        "is_sign": 0,
        date,
        time: now.valueOf() / 1000,
        day: i+1,
        week: now.day(),
        current: now.isBefore(today)? 'before' : (now.isAfter(today) ? 'after':'today'),
      })
    }
    state.data.days = list;
  }

  async function getData(month) {
    // 统一把 month 归一化成 YYYY-MM，彻底避免出现 month=0
    const normalizeMonth = (m) => {
      const now = dayjs();
      const yearFromState = parseInt(state.cur_year) || now.year();
      const monthFromState = parseInt(state.cur_month) || (now.month() + 1);

      // 常见 bug：调用方传了 0 / '0'
      if (m === 0 || m === '0') {
        return `${yearFromState}-${String(monthFromState).padStart(2, '0')}`;
      }

      // 允许传 month-of-year: 1..12
      if (typeof m === 'number') {
        if (m >= 1 && m <= 12) return `${yearFromState}-${String(m).padStart(2, '0')}`;
        // 兼容旧逻辑：把数字当作月份偏移量
        return now.add(m, 'month').format('YYYY-MM');
      }

      // 空值：默认当前月
      if (!m) return now.format('YYYY-MM');

      if (typeof m === 'string') {
        if (/^\d{4}-\d{2}$/.test(m)) return m;
        if (/^\d{4}-\d{1,2}$/.test(m)) {
          const [y, mo] = m.split('-');
          return `${y}-${String(mo).padStart(2, '0')}`;
        }
        if (/^\d{1,2}$/.test(m)) return `${yearFromState}-${String(m).padStart(2, '0')}`;
      }

      // 兜底：尝试 dayjs 解析
      const parsed = dayjs(m);
      return parsed.isValid() ? parsed.format('YYYY-MM') : now.format('YYYY-MM');
    };

    const monthStr = normalizeMonth(month);
    
    const res = await sheep.$api.activity.signList({month: monthStr});
    // 兼容：后端可能直接返回数组，也可能包装在 data/rows 里
    const list = Array.isArray(res) ? res : (res?.data || res?.rows || []);
    const signList = [];
    list.forEach((it) => {
      // 后端实体字段是 signDate(yyyy-MM-dd)，createTime 可能为空或格式不稳定
      const rawDate = it?.signDate || it?.createTime;
      if (!rawDate) return;
      const d = dayjs(rawDate);
      if (!d.isValid()) return;
      signList.push(d.date());
    });

    if (state.data) {
      state.data.days.forEach((i, index) => {
        i.is_sign = signList.includes(i.day) ? 1 : 0
      });
      
      // 更新当前年月显示
      if (monthStr) {
        const arr = monthStr.split('-');
        state.cur_year = arr[0];
        state.cur_month = arr[1];
      } else if (state.data.days.length > 0) {
        let arr = state.data.days[0].date.split('-');
        state.cur_year = arr[0];
        state.cur_month = arr[1];
      }
      
      // 更新今日签到状态
      state.data.days.forEach((i) => {
        if (i.current === 'today') {
          state.isSign = i.is_sign;
        }
      });
    }
  }

  onReady(async () => {
    // 初始化签到数据
    await initData()
  });

  async function initData(){
    await getSignRule()
    const currentMonth = dayjs().format('YYYY-MM');
    initDays(currentMonth);
    // 传递当前月份的YYYY-MM格式
    getData(currentMonth);
  }

  async function getSignRule(){
    const res = await sheep.$api.data.getSysConfig({configKey:'activity-integral-income-set-key'});
    state.rules = res.data ? JSON.parse(res.data) : {signCount: 1,signStatus: 1}
  }

  //切换控制年月，上一个月，下一个月
  const handleCalendar = (minus) => {
    const cur_year = parseInt(state.cur_year) || dayjs().year();
    const cur_month = parseInt(state.cur_month) || dayjs().month() + 1;
    let newMonth = cur_month + minus;
    let newYear = cur_year;
    
    // 处理月份边界
    if (newMonth < 1) {
      newYear = cur_year - 1;
      newMonth = 12;
    } else if (newMonth > 12) {
      newYear = cur_year + 1;
      newMonth = 1;
    }
    
    // 直接用目标年月（YYYY-MM）
    const monthStr = `${newYear}-${newMonth > 9 ? newMonth : '0' + newMonth}`;
    initDays(monthStr);
    getData(monthStr);
  };
</script>

<style lang="scss" scoped>
  .header-box {
    border-top: 2rpx solid rgba(#dfdfdf, 0.5);
  }

  // 日历
  .calendar {
    background: #fff;

    .sign-everyday {
      height: 100rpx;
      background: rgba(255, 255, 255, 1);
      border: 2rpx solid rgba(223, 223, 223, 0.4);

      .sign-everyday-title {
        font-size: 32rpx;
        color: rgba(51, 51, 51, 1);
        font-weight: 500;
      }

      .sign-num-box {
        font-size: 26rpx;
        font-weight: 500;
        color: rgba(153, 153, 153, 1);

        .sign-num {
          font-size: 30rpx;
          font-weight: 600;
          color: #ff6000;
          padding: 0 10rpx;
          font-family: OPPOSANS;
        }
      }
    }

    // 年月日
    .bar {
      height: 100rpx;

      .date {
        font-size: 30rpx;
        font-family: OPPOSANS;
        font-weight: 500;
        color: #333333;
        line-height: normal;
      }
    }

    .cicon-back {
      margin-top: 6rpx;
      font-size: 30rpx;
      color: #c4c4c4;
      line-height: normal;
    }

    .cicon-forward {
      margin-top: 6rpx;
      font-size: 30rpx;
      color: #c4c4c4;
      line-height: normal;
    }

    // 星期
    .week {
      .week-item {
        font-size: 24rpx;
        font-weight: 500;
        color: rgba(153, 153, 153, 1);
        flex: 1;
      }
    }

    // 日历表
    .myDateTable {
      display: flex;
      flex-wrap: wrap;

      .dateCell {
        width: calc(750rpx / 7);
        height: 80rpx;
        font-size: 26rpx;
        font-weight: 400;
        color: rgba(51, 51, 51, 1);
      }
    }
  }

  .is-sign {
    width: 48rpx;
    height: 48rpx;
    position: relative;

    .is-sign-num {
      font-size: 24rpx;
      font-family: OPPOSANS;
      font-weight: 500;
      line-height: normal;
    }

    .is-sign-mark {
      position: absolute;
      right: -8rpx;
      top: -8rpx;
      width: 24rpx;
      height: 24rpx;
      background-color: #ff6000;
      color: white;
      border-radius: 50%;
      font-size: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
  }

  .cell-num {
    font-size: 24rpx;
    font-family: OPPOSANS;
    font-weight: 500;
    color: #333333;
    line-height: normal;
  }

  .cicon-title {
    position: absolute;
    right: -10rpx;
    top: -6rpx;
    font-size: 20rpx;
    color: red;
  }

  //签到按钮
  .sign-box {
    height: 140rpx;
    width: 100%;

    .sign-btn {
      width: 710rpx;
      height: 80rpx;
      border-radius: 35rpx;
      font-size: 30rpx;
      font-weight: 500;
      box-shadow: 0 0.2em 0.5em rgba(#ff6000, 0.4);
      background: linear-gradient(90deg, #ff6000, #fe832a);
      color: #fff;
    }

    .already-btn {
      width: 710rpx;
      height: 80rpx;
      border-radius: 35rpx;
      font-size: 30rpx;
      font-weight: 500;
    }
  }
  
  // 补签按钮
  .replenish-btn {
    width: 710rpx;
    height: 80rpx;
    border-radius: 35rpx;
    font-size: 30rpx;
    font-weight: 500;
    box-shadow: 0 0.2em 0.5em rgba(#4a90e2, 0.4);
    background: linear-gradient(90deg, #4a90e2, #5b9cf1);
    color: #fff;
  }
  
  // 补签弹窗样式
  .replenish-days {
    width: 100%;
    padding: 20rpx;
    
    .replenish-day-item {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      background-color: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10rpx;
      font-size: 24rpx;
      font-weight: 500;
      color: #333;
      
      &:active {
        background-color: #e0e0e0;
      }
    }
    
    .replenish-day-selected {
      background-color: #4a90e2;
      color: white;
    }
  }
  
  .cancel-btn {
    width: 220rpx;
    height: 70rpx;
    border: 2rpx solid #999;
    border-radius: 35rpx;
    font-size: 28rpx;
    font-weight: 500;
    color: #999;
    line-height: normal;
  }

  .model-box {
    width: 520rpx;
    // height: 590rpx;
    background: linear-gradient(177deg, #ff6000 0%, #fe832a 100%);
    // background: linear-gradient(177deg, var(--ui-BG-Main), var(--ui-BG-Main-gradient));
    border-radius: 10rpx;

    .cicon-check-round {
      font-size: 70rpx;
      color: #fff;
    }

    .score-title {
      font-size: 34rpx;
      font-family: OPPOSANS;
      font-weight: 500;
      color: #fcff00;
    }

    .model-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #ffffff;
    }

    .model-bg {
      width: 520rpx;
      height: 344rpx;
      background-size: 100% 100%;
      background-image: v-bind(headerBg);
      background-repeat: no-repeat;
      border-radius: 0 0 10rpx 10rpx;

      .title {
        font-size: 34rpx;
        font-weight: bold;
        // color: var(--ui-BG-Main);
        color: #ff6000;
      }

      .subtitle {
        font-size: 26rpx;
        font-weight: 500;
        color: #999999;
      }

      .cancel-btn {
        width: 220rpx;
        height: 70rpx;
        border: 2rpx solid #ff6000;
        border-radius: 35rpx;
        font-size: 28rpx;
        font-weight: 500;
        color: #ff6000;
        line-height: normal;
        margin-right: 10rpx;
      }

      .confirm-btn {
        width: 220rpx;
        height: 70rpx;
        background: linear-gradient(90deg, #ff6000, #fe832a);
        box-shadow: 0 0.2em 0.5em rgba(#ff6000, 0.4);
        border-radius: 35rpx;
        font-size: 28rpx;
        font-weight: 500;
        color: #ffffff;
        line-height: normal;
      }
    }
  }

  //签到说明
  .activity-title {
    font-size: 32rpx;
    font-weight: 500;
    color: #333333;
    line-height: normal;
  }

  .activity-des {
    font-size: 26rpx;
    font-weight: 500;
    color: #666666;
    line-height: 40rpx;
  }
</style>
