# authorization — 登录授权生成技能

> 本技能生成微信小程序登录（手机号快捷登录）、登录态管理、隐私合规与游客体验的完整代码。

---

## 一、完整登录流程（微信原生）

```
用户点击登录入口
  → 弹出登录 Sheet（mask + sheet）
  → 用户勾选协议
  → 点击"手机号快捷登录"按钮
  → button open-type="getPhoneNumber" 触发微信授权
  → 回调拿到 code
  → 前端调后端 /api/v1/wx/login { code, anonId }
  → 后端返回 { token, userId, nickname, avatarUrl }
  → 前端 setLogin() 持久化 token + 用户信息
  → 关闭 Sheet → Toast "登录成功" → 原地刷新数据
```

---

## 二、app.js — 全局登录态管理

```js
// app.js
App({
  onLaunch() {
    // 初始化匿名 ID（未登录态用）
    this.globalData.anonId = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    // 恢复登录态
    var token = wx.getStorageSync('_vitrine_token');
    if (token) {
      this.globalData.token = token;
      this.globalData.isLoggedIn = true;
      this.globalData.userId = wx.getStorageSync('_vitrine_user_id') || '';
      this.globalData.nickname = wx.getStorageSync('_vitrine_nickname') || '';
      this.globalData.avatarUrl = wx.getStorageSync('_vitrine_avatar_url') || '';
    }
  },

  setLogin(token, userId, nickname, avatarUrl) {
    this.globalData.token = token;
    this.globalData.isLoggedIn = true;
    this.globalData.userId = userId;
    this.globalData.nickname = nickname;
    this.globalData.avatarUrl = avatarUrl || '';
    wx.setStorageSync('_vitrine_token', token);
    wx.setStorageSync('_vitrine_nickname', nickname);
    wx.setStorageSync('_vitrine_user_id', userId);
    wx.setStorageSync('_vitrine_avatar_url', avatarUrl || '');
  },

  logout() {
    this.globalData.token = null;
    this.globalData.isLoggedIn = false;
    this.globalData.userId = '';
    this.globalData.nickname = '';
    this.globalData.avatarUrl = '';
    wx.removeStorageSync('_vitrine_token');
    wx.removeStorageSync('_vitrine_nickname');
    wx.removeStorageSync('_vitrine_user_id');
    wx.removeStorageSync('_vitrine_avatar_url');
  },

  globalData: {
    anonId: '',
    userId: '',
    nickname: '',
    avatarUrl: '',
    token: null,
    isLoggedIn: false
  }
});
```

---

## 三、API 模块 — 登录接口

```js
// utils/api.js

/**
 * 微信手机号登录
 * @param {string} code - getPhoneNumber 回调的 code
 * @param {string} anonId - 匿名用户 ID
 */
function wxLogin(code, anonId) {
  return baseRequest({
    url: '/api/v1/wx/login',
    method: 'POST',
    data: { code: code, anonId: anonId }
  });
}

/**
 * 获取当前用户资料
 */
function getWxProfile() {
  return baseRequest({ url: '/api/v1/wx/user/profile' });
}

/**
 * 更新用户资料（昵称 / 头像）
 */
function updateWxProfile(data) {
  return baseRequest({
    url: '/api/v1/wx/user/profile',
    method: 'PUT',
    data: data
  });
}
```

---

## 四、登录 Sheet 组件模板（微信原生）

### WXML

```xml
<!-- 登录 Sheet — 嵌入任意页面底部 -->
<view class="mask" wx:if="{{loginSheetVisible}}" bindtap="onLoginSheetClose">
  <view class="sheet" catchtap="onSheetContentTap">
    <view class="grab"></view>
    <view class="brand-icon">品</view>
    <view class="sheet-title">欢迎使用</view>
    <view class="sub">登录后享受完整功能</view>
    <button class="wx-login-btn"
            open-type="getPhoneNumber"
            bindgetphonenumber="onGetPhoneNumber">
      手机号快捷登录
    </button>
    <view class="agree-row">
      <view class="agree-check {{agreed ? 'checked' : ''}}" bindtap="onAgreeToggle">
        <text wx:if="{{agreed}}" class="agree-check-mark">✓</text>
      </view>
      <text class="agree-text">
        同意
        <text class="agree-link" bindtap="onOpenAgreement" data-type="service">《服务协议》</text>
        和
        <text class="agree-link" bindtap="onOpenAgreement" data-type="privacy">《隐私政策》</text>
      </text>
    </view>
  </view>
</view>
```

### JS

```js
Page({
  data: {
    loginSheetVisible: false,
    agreed: false
  },

  /** 主动触发登录（如点击收藏） */
  onNeedLogin(e) {
    if (getApp().globalData.isLoggedIn) {
      this.doAction(e);  // 已登录 → 直接执行
    } else {
      this.setData({ loginSheetVisible: true, agreed: false });
    }
  },

  onLoginSheetClose() {
    this.setData({ loginSheetVisible: false });
  },

  // 阻止点击穿透
  onSheetContentTap() {},

  onAgreeToggle() {
    this.setData({ agreed: !this.data.agreed });
  },

  onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '需要授权手机号才能登录', icon: 'none' });
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意相关协议', icon: 'none' });
      return;
    }
    var app = getApp();
    api.wxLogin(e.detail.code, app.globalData.anonId).then(function(res) {
      app.setLogin(res.token, res.userId, res.nickname || '', res.avatarUrl || '');
      this.setData({ loginSheetVisible: false });
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.refreshData();  // 刷新当前页面数据
    }.bind(this)).catch(function(err) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    });
  },

  onOpenAgreement(e) {
    var type = e.currentTarget.dataset.type || 'service';
    wx.navigateTo({ url: '/pages/agreement/agreement?type=' + type });
  }
});
```

---

## 五、游客体验模式 — 登录门控

```js
// 在任何需要登录的操作入口，统一使用 onNeedLogin
onFavTap(e) {
  if (!getApp().globalData.isLoggedIn) {
    this.setData({ loginSheetVisible: true, agreed: false });
    return;
  }
  wx.navigateTo({ url: '/pages/favorites/favorites' });
},

onSettingsTap(e) {
  if (!getApp().globalData.isLoggedIn) {
    this.setData({ loginSheetVisible: true, agreed: false });
    return;
  }
  wx.navigateTo({ url: '/pages/settings/settings' });
}
```

---

## 六、隐私合规 API

```js
// app.js onLaunch
wx.getPrivacySetting({
  success: function(res) {
    if (res.needAuthorization) {
      // 触发隐私授权弹窗（微信提供的能力）
      wx.requirePrivacyAuthorize({
        success: function() {},
        fail: function() {
          // 用户拒绝授权，可引导重新打开
        }
      });
    }
  }
});
```

## 七、协议页面模板

```
/pages/agreement/agreement
  → ?type=service   用户服务协议
  → ?type=privacy   隐私政策
```

协议页面使用 `scroll-view` 渲染 `rich-text` 内容，从后端获取协议文本（支持动态更新）。
