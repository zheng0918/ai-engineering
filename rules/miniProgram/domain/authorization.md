# authorization — 授权与登录规范

> 本文件规定微信小程序授权登录、手机号获取与用户信息同步的约束。

---

## 1. 登录流程

```
1. wx.login() → 获取 code
2. 后端用 code 换 openid + session_key
3. 后端签发 JWT 返回前端
4. 前端存储 token，设置请求头
5. 获取用户信息（头像/昵称需用户主动授权）
```

---

## 2. 登录实现

```ts
// api/auth.ts
import http from './request';

export const wxLogin = (code: string) =>
  http<{ token: string; userInfo: UserVO }>({
    url: '/api/v1/auth/wx-login',
    method: 'POST',
    data: { code },
  });

export const updateUserInfo = (data: { avatar: string; nickname: string }) =>
  http({ url: '/api/v1/user/info', method: 'PUT', data });
```

```ts
// utils/login.ts
import { wxLogin } from '@/api/auth';
import { useUserStore } from '@/store/user';

export const doLogin = async (): Promise<boolean> => {
  try {
    const { code } = await uni.login();
    if (!code) throw new Error('获取 code 失败');
    const res = await wxLogin(code);
    useUserStore().token = res.token;
    uni.setStorageSync('token', res.token);
    return true;
  } catch (e) {
    console.error('登录失败', e);
    return false;
  }
};
```

---

## 3. 手机号授权

```vue
<template>
  <button type="primary" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
    手机号快捷登录
  </button>
</template>

<script setup lang="ts">
import { bindPhone } from '@/api/auth';

const onGetPhone = async (e: any) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
  try {
    await bindPhone({ code: e.detail.code });  // code 传给后端解密
    uni.showToast({ title: '绑定成功' });
  } catch (err: any) {
    uni.showToast({ title: err.message, icon: 'none' });
  }
};
</script>
```

---

## 4. 用户信息授权（头像/昵称）

```vue
<template>
  <button type="primary" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
    <image :src="avatar" mode="aspectFill" />
  </button>
  <input type="nickname" v-model="nickname" placeholder="请输入昵称" />
</template>
```

---

## 5. 登录态管理

- token 持久化在 Storage，启动时恢复
- 请求拦截器自动注入 `Authorization: Bearer {token}`
- token 过期（code=2004）→ 清除 token → 重新登录
- App.vue `onLaunch` 中调用 `userStore.init()` 恢复登录态

---

## 6. 登录页 UI 设计

> 登录页是小程序的第一印象。以下规范适用于微信原生开发。

### 6.1 登录方式选择

| 登录方式 | 适用场景 | 组件 |
|---------|---------|------|
| **手机号快捷登录**（推荐） | 正式项目，需要用户标识 | `button open-type="getPhoneNumber"` |
| **静默登录** | 仅需 openid，不强制用户感知 | `wx.login()` 静默完成（需后端配合） |
| **用户名密码** | 不推荐（微信小程序内不合规） | 自定义表单 |

> **推荐手机号快捷登录。** 微信自 2023 年起逐步收紧 `wx.getUserInfo` / `wx.getUserProfile` 接口，手机号是最稳定的用户标识来源。

### 6.2 登录页布局标准

登录页必须包含三个区域（从上到下）：

```
┌──────────────────────┐
│   品牌区（视觉锚点）      │  ← Logo/品牌图标/品牌名/Slogan
│   .brand-icon          │     圆形品牌图标 + 品牌名
│   .brand-name          │     非必须但强烈推荐
│   .brand-slogan        │
│                        │
│   操作区（核心动作）      │  ← 手机号登录按钮
│   .wx-login-btn        │     open-type="getPhoneNumber"
│                        │
│   协议区（合规要求）      │  ← 协议勾选 + 链接
│   .agree-row           │     ☑ 同意《用户服务协议》和《隐私政策》
│   .agree-check +       │
│   .agree-text +        │
│   .agree-link          │
└──────────────────────┘
```

### 6.3 登录页 vs 登录 Sheet

| 形态 | 适用场景 | 实现 |
|------|---------|------|
| **登录 Sheet**（底部弹出面板 ⭐ 推荐） | 游客可浏览部分内容，关键操作时引导登录 | `mask` + `sheet` 全局样式 |
| **独立登录页** | 进入即需登录（如企业后台） | 独立 `pages/login/login` 页面 |
| **登录弹窗** | 不建议 — 微信限频，体验差 | `wx.showModal` |

> **推荐登录 Sheet。** 不中断用户浏览流程，保留上下文。关闭 Sheet 后回到原页面，不丢失浏览状态。

### 6.4 登录 Sheet 实现（微信原生）

**WXML 结构：**

```xml
<!-- mask + sheet -->
<view class="mask" wx:if="{{loginSheetVisible}}" bindtap="onLoginSheetClose">
  <view class="sheet" catchtap="onSheetContentTap">
    <view class="grab"></view>
    <view class="brand-icon">品</view>
    <view class="sheet-title">欢迎使用</view>
    <view class="sub">登录后享受完整功能</view>
    <button class="wx-login-btn" open-type="getPhoneNumber"
            bindgetphonenumber="onGetPhoneNumber">
      手机号快捷登录
    </button>
    <!-- 协议勾选 -->
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

**WXSS（全局 app.wxss 中定义 `.mask` `.sheet` `.brand-icon` `.wx-login-btn` `.agree-row`，页面只定义间距）：**

```css
/* 页面级微调 */
.login-sheet .sheet-title { color: var(--ink); }
.login-sheet .sub { margin-top: 4rpx; }
```

**JS 逻辑：**

```js
Page({
  data: {
    loginSheetVisible: false,
    agreed: false
  },

  // 需要登录的操作触发
  onNeedLogin() {
    if (getApp().globalData.isLoggedIn) {
      this.doAction();  // 已登录，直接执行
    } else {
      this.setData({ loginSheetVisible: true, agreed: false });
    }
  },

  onLoginSheetClose() {
    this.setData({ loginSheetVisible: false });
  },

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
    // 调后端 wxLogin
    var app = getApp();
    api.wxLogin(e.detail.code, app.globalData.anonId).then(function(res) {
      app.setLogin(res.token, res.userId, res.nickname || '', res.avatarUrl || '');
      this.setData({ loginSheetVisible: false });
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.refreshData();  // 登录后刷新页面数据
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

## 7. 游客体验（未登录态体验闭环）

> 关键原则：**先体验，后登录。** 不要一打开小程序就弹登录。

### 7.1 哪些内容游客必须可见

- 首页 / 产品列表 / 公司介绍 — 完全公开
- 视频 / 图片 — 完全公开
- 搜索 — 完全公开

### 7.2 哪些操作触发登录引导

- 收藏 / 点赞
- 个人设置
- 下单 / 支付
- 查看订单 / 收藏列表

### 7.3 登录前后状态切换

```
未登录态                  →    已登录态
"请登录" 占位头像          →    用户头像 + 昵称
收藏按钮 点后弹 Sheet      →    收藏按钮 直接 toggle
收藏列表页 引导登录         →    展示收藏列表
个人中心 显示"请登录"       →    显示用户资料
```

### 7.4 关键体验细节

- 登录成功后**原地继续**操作（不是跳回首页）— 收藏→登录→自动收藏，不是收藏→登录→回到首页
- 登录 Sheet 关闭后**保持当前页面位置** — 用户取消登录应继续浏览
- **不重复弹** — 同一会话中用户关闭 Sheet 后，本次浏览不再主动弹出（除非主动点击登录入口）

---

## 8. 隐私合规

> 微信自 2023.09.15 起强制要求：涉及用户隐私的接口必须先通过隐私弹窗授权。

### 8.1 必接 API

```js
// app.js onLaunch 中注册隐私授权
wx.getPrivacySetting({
  success: function(res) {
    if (res.needAuthorization) {
      // 需要弹出隐私协议弹窗
      wx.requirePrivacyAuthorize({
        success: function() { /* 用户同意 */ },
        fail: function() { /* 用户拒绝，开发者需处理 */ }
      });
    }
  }
});
```

### 8.2 隐私协议内容

需要实现独立的**用户协议**和**隐私政策**页面（可共用同一个页面，通过 `?type=` 区分）：

```
/pages/agreement/agreement?type=service    → 用户服务协议
/pages/agreement/agreement?type=privacy    → 隐私政策
```

页面内容使用 `<scroll-view>` + `<rich-text>` 渲染后端返回的协议文本。

### 8.3 隐私合规检查清单

- [ ] 登录按钮前有「用户服务协议」和「隐私政策」勾选
- [ ] 两篇协议独立可点击查看
- [ ] `app.json` 中已配置 `"__usePrivacyCheck__": true`
- [ ] 敏感数据（手机号/身份证/位置）不在前端明文存储
- [ ] Storage key 加了项目前缀，避免跨项目泄露

---

## 9. 禁止事项

- ❌ 直接在小程序端存储 openid / session_key（应在后端管理）
- ❌ 跳过 wx.login 直接调业务接口
- ❌ token 过期不做静默重登录
- ❌ 强制用户授权头像/昵称（应提供跳过选项）
- ❌ 一打开小程序就弹登录（必须游客可浏览核心内容）
- ❌ 登录成功后跳回首页（应原地继续操作）
- ❌ 隐私协议不提供独立查看入口（登录按钮前必须有链接）
- ❌ 同一会话重复弹登录 Sheet（用户关闭后不应再弹）
- ❌ 登录页使用 `wx.showModal` 弹窗（应使用底部 Sheet 或独立页面）
- ❌ `open-type="getPhoneNumber"` 回调不做协议勾选检查
