# payment — 支付插件生成技能

> 本技能生成微信支付完整流程代码（下单→支付→轮询确认→超时处理→退款）。

---

## 一、支付工具（微信原生完整流程）

### utils/pay.js

```js
var api = require('./api.js');

/**
 * 发起微信支付（完整流程）。
 * @param {string} orderId - 后端下单返回的订单号
 */
function doPay(orderId) {
  return new Promise(function(resolve, reject) {
    // 1. 后端获取支付参数
    api.getPayParams(orderId).then(function(params) {
      // 2. 调起微信支付
      wx.requestPayment({
        timeStamp: params.timeStamp,
        nonceStr: params.nonceStr,
        package: params.package,
        signType: params.signType || 'RSA',
        paySign: params.paySign,
        success: function() {
          // 3. 前端 success 仅显示 Toast
          wx.showToast({ title: '支付成功' });
          // 4. 主动轮询确认（双重保障）
          pollOrderStatus(orderId);
          resolve({ success: true, orderId: orderId });
        },
        fail: function(err) {
          if (err.errMsg.indexOf('cancel') !== -1) {
            wx.showToast({ title: '已取消支付', icon: 'none' });
            reject({ cancelled: true });
          } else {
            wx.showToast({ title: '支付失败，请重试', icon: 'none' });
            reject(err);
          }
        }
      });
    }).catch(function(err) {
      wx.showToast({ title: err.message || '获取支付参数失败', icon: 'none' });
      reject(err);
    });
  });
}

/**
 * 轮询订单状态（支付确认双保险）。
 * 后端异步回调可能延迟，前端主动查询补齐。
 */
function pollOrderStatus(orderId, maxRetries) {
  maxRetries = maxRetries || 6;
  var retries = 0;

  function poll() {
    api.getOrderDetail(orderId).then(function(order) {
      if (order.status === 'paid' || order.status === 'shipped') {
        wx.redirectTo({ url: '/pages/order/detail?id=' + orderId });
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(poll, 5000);
      }
    }).catch(function() {
      if (retries < maxRetries) { retries++; setTimeout(poll, 5000); }
    });
  }
  poll();
}

/**
 * 支付倒计时（基于服务端 expireTime 时间戳）。
 * 页面 onUnload 时调用 clearInterval(timer) 清理。
 */
function startPayCountdown(that, expireTime) {
  var timer = setInterval(function() {
    var remain = expireTime - Date.now();
    if (remain <= 0) {
      clearInterval(timer);
      that.setData({ countdownText: '订单已超时', orderExpired: true });
      return;
    }
    var m = Math.floor(remain / 60000);
    var s = Math.floor((remain % 60000) / 1000);
    that.setData({ countdownText: m + '分' + s + '秒' });
  }, 1000);
  return timer;
}

module.exports = { doPay: doPay, pollOrderStatus: pollOrderStatus, startPayCountdown: startPayCountdown };
```

---

## 二、支付底部栏组件（微信原生 WXML）

```xml
<!-- 订单结算底部栏 -->
<view class="pay-bar">
  <view class="pay-bar-left">
    <text>合计：</text>
    <text class="pay-bar-price">¥{{totalPrice}}</text>
  </view>
  <button class="pay-bar-btn" bindtap="onSubmitOrder" loading="{{paying}}">
    立即支付
  </button>
</view>
```

```css
.pay-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--surface);
  border-top: 1px solid var(--line);
  z-index: 100;
}
.pay-bar-price { font-size: 36rpx; font-weight: 700; color: var(--brand); }
.pay-bar-btn {
  width: 200rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: var(--brand);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.pay-bar-btn::after { border: none; }
```

---

## 三、支付倒计时 WXML

```xml
<!-- 订单待支付页面中的倒计时 -->
<view class="pay-countdown" wx:if="{{orderStatus === 'pending'}}">
  <text class="countdown-label">剩余支付时间</text>
  <text class="countdown-time">{{countdownText}}</text>
</view>
<view class="pay-countdown expired" wx:elif="{{orderExpired}}">
  <text>订单已超时取消</text>
</view>
```

```css
.pay-countdown { text-align: center; padding: 24rpx; }
.countdown-label { font-size: 24rpx; color: var(--muted); }
.countdown-time { display: block; font-size: 48rpx; font-weight: 700; color: var(--brand); }
.pay-countdown.expired { color: var(--faint); }
```

---

## 四、退款申请页面 JS

```js
// pages/refund/apply.js
Page({
  data: {
    orderId: '',
    refundType: 'refund',  // refund | return
    reason: '',
    amount: '',
    reasons: ['不想要了', '商品与描述不符', '质量问题', '发错货', '其他'],
    submitting: false
  },

  onLoad: function(options) {
    this.setData({
      orderId: options.orderId || '',
      refundType: options.type || 'refund'
    });
  },

  onSelectReason: function(e) {
    this.setData({ reason: e.currentTarget.dataset.reason });
  },

  onSubmit: function() {
    if (!this.data.reason) {
      wx.showToast({ title: '请选择退款原因', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    api.applyRefund({
      orderId: this.data.orderId,
      type: this.data.refundType,
      reason: this.data.reason
    }).then(function() {
      wx.showToast({ title: '退款申请已提交' });
      wx.navigateBack();
    }).catch(function(err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }).finally(function() {
      this.setData({ submitting: false });
    }.bind(this));
  }
});
```
