# error-handling — 错误处理生成技能

> 本技能生成微信原生小程序全局错误捕获、错误分类、网络策略与页面异常状态 UI。

---

## 一、全局错误捕获（app.js）

```js
// app.js
App({
  onLaunch() {
    this.initErrorHandler();
  },

  initErrorHandler() {
    // 全局 JS 错误
    wx.onError(function(err) {
      console.error('[AppError]', err);
    });

    // 未捕获 Promise 错误
    wx.onUnhandledRejection(function(res) {
      console.error('[UnhandledRejection]', res.reason);
    });
  }
});
```

## 二、网络状态监听（app.js）

```js
App({
  onLaunch() {
    this.initNetworkHandler();
  },

  initNetworkHandler() {
    // 监听网络变化
    wx.onNetworkStatusChange(function(res) {
      if (!res.isConnected) {
        wx.showToast({ title: '当前无网络', icon: 'none', duration: 3000 });
      }
    });

    // 启动时检查
    wx.getNetworkType({
      success: function(res) {
        if (res.networkType === 'none') {
          wx.showToast({ title: '当前无网络', icon: 'none' });
        }
      }
    });
  }
});
```

## 三、请求重试封装

```js
function requestWithRetry(options, retries) {
  retries = retries || 2;
  return new Promise(function(resolve, reject) {
    function attempt(n) {
      wx.request({
        ...options,
        success: function(res) {
          if (res.statusCode === 200) resolve(res);
          else if (n > 0) attempt(n - 1);
          else reject(new Error('请求失败'));
        },
        fail: function(err) {
          if (n > 0) attempt(n - 1);
          else reject(err);
        }
      });
    }
    attempt(retries);
  });
}
```

## 四、页面错误状态 UI（WXML）

```xml
<!-- 页面级错误 — 可嵌入任何页面 -->
<view wx:if="{{error}}" class="empty-wrap">
  <view class="empty">
    <view class="ic">!</view>
    <view class="t">{{error}}</view>
    <button class="retry-btn" bindtap="onRetry">重新加载</button>
  </view>
</view>
```

```css
.retry-btn {
  margin-top: 32rpx;
  padding: 16rpx 48rpx;
  border-radius: 24rpx;
  border: 1px solid var(--brand);
  color: var(--brand);
  font-size: 26rpx;
  background: none;
}
.retry-btn::after { border: none; }
```

## 五、Toast 工具封装

```js
// utils/util.js
function showToast(title, icon) {
  wx.showToast({ title: title, icon: icon || 'none', duration: 1600 });
}

module.exports = { showToast: showToast };
```
