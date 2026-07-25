# error-handling — 错误处理规范

> 本文件规定前端全局异常捕获、错误边界与用户提示的约束。

---

## 1. 错误分层处理

| 层 | 处理方式 |
|---|---|
| Axios 拦截器 | 网络异常 toast / token 过期跳转 / 业务错误 toast |
| 页面级 | try-catch 包裹 API 调用，显示具体错误 |
| 全局 | `app.config.errorHandler` 捕获未知错误 |

---

## 2. Axios 错误统一处理

```ts
// api/request.ts 响应拦截器
http.interceptors.response.use(
  (response) => {
    const { code, message } = response.data;
    if (code === 0) return response.data;
    if (code === 2004) { /* token 过期 */ }
    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message));
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      ElMessage.error('网络连接失败，请检查网络');
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试');
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误');
    } else {
      ElMessage.error('网络异常，请稍后重试');
    }
    return Promise.reject(error);
  },
);
```

---

## 3. 全局异常捕获

```ts
// main.ts
app.config.errorHandler = (err, _instance, info) => {
  console.error('全局错误', err, info);
  // 上报监控平台
};
```

---

## 4. 组件错误边界（Vue 3）

```vue
<template>
  <slot v-if="!hasError" />
  <el-result v-else status="error" title="组件渲染异常" sub-title="请刷新页面重试">
    <template #extra>
      <el-button type="primary" @click="hasError = false">重试</el-button>
    </template>
  </el-result>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);

onErrorCaptured((err) => {
  console.error('组件错误', err);
  hasError.value = true;
  return false; // 阻止向上传播
});
</script>
```

---

## 5. 禁止事项

- ❌ 吞异常（catch 后不处理也不提示）
- ❌ 敏感信息出现在错误提示中
- ❌ 未登录/无权限不跳转到登录页
