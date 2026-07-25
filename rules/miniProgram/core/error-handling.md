# error-handling — 错误处理规范

> 本文件规定小程序错误处理、全局异常捕获与用户提示的约束。

---

## 1. 错误分类

| 类型 | 示例 | 处理方式 |
|---|---|---|
| 网络异常 | timeout / 断网 | toast "网络异常，请稍后重试" + 重试按钮 |
| 业务错误 | 库存不足 / 密码错误 | toast 后端返回的 message |
| 登录失效 | code=2004 | 清除 token → 跳登录 |
| 系统错误 | code=9999 / 5xx | toast "系统繁忙，请稍后重试" |
| 参数校验 | code=1001 | toast 字段级错误信息 |

---

## 2. 全局错误处理

```ts
// App.vue onError
import { onError } from '@dcloudio/uni-app';

onError((err) => {
  console.error('小程序全局错误', err);
  // 上报监控平台
});
```

```ts
// 未捕获 Promise 错误
uni.onUnhandledRejection((res) => {
  console.error('未捕获 Promise 错误', res.reason);
});
```

---

## 3. 请求错误统一处理

在 `api/request.ts` 的拦截器中统一处理：

```ts
if (body.code === 2004) {
  // token 失效 → 静默重登录或跳转
  useUserStore().logout();
  uni.reLaunch({ url: PAGES.LOGIN });
}
if (body.code === 9999) {
  uni.showToast({ title: '系统繁忙，请稍后重试', icon: 'none' });
}
```

---

## 4. 页面级错误处理

每个页面必须处理异常状态：

```vue
<template>
  <view v-if="error" class="error-page">
    <u-empty :text="error" mode="network" />
    <u-button @click="retry">重新加载</u-button>
  </view>
</template>

<script setup lang="ts">
const error = ref('');
const retry = () => { error.value = ''; fetchData(); };
</script>
```

---

## 5. 网络策略（微信原生）

> 移动端网络不可靠是常态，不是异常。

### 5.1 网络状态监听

```js
// app.js onLaunch
wx.onNetworkStatusChange(function(res) {
  if (!res.isConnected) {
    wx.showToast({ title: '当前无网络', icon: 'none', duration: 3000 });
  } else {
    // 网络恢复后自动重试失败请求
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
```

### 5.2 请求超时配置

```js
// utils/api.js — 统一超时
wx.request({
  url: url,
  timeout: 15000,  // 15s 超时
  // ...
});
```

### 5.3 自动重试策略

```js
function requestWithRetry(options, retries) {
  retries = retries || 2;  // 最多重试2次
  return new Promise(function(resolve, reject) {
    function attempt(n) {
      wx.request({
        ...options,
        success: function(res) {
          if (res.statusCode === 200) resolve(res);
          else if (n > 0) attempt(n - 1);  // 网络错误可重试
          else reject(new Error('请求失败'));
        },
        fail: function(err) {
          if (n > 0) attempt(n - 1);  // 超时/断网可重试
          else reject(err);
        }
      });
    }
    attempt(retries);
  });
}
```

### 5.4 弱网提示规则

| 场景 | 提示 | 时机 |
|------|------|------|
| 网络断开 | "当前无网络" | 立即 |
| 请求超时 | "网络不稳定，请稍后重试" | 15s 后 |
| 网络恢复 | Toast 消失 + 自动刷新 | `onNetworkStatusChange` 回调 |

---

## 6. 禁止事项

- ❌ 所有错误直接 toast 不分类
- ❌ try-catch 后不处理异常（吞异常）
- ❌ 敏感信息出现在错误提示中
- ❌ 页面无 error 状态展示（白屏）
