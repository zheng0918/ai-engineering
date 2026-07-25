# error-handling — 错误处理生成技能

> 本技能生成全局异常捕获、Axios 错误处理、错误边界组件。

---

## 生成清单

- `api/request.ts` — 响应拦截器（分类处理错误）
- `utils/errorHandler.ts` — 错误信息提取
- `components/base/ErrorBoundary.vue` — 错误边界组件

## 错误信息提取

```ts
// utils/errorHandler.ts
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return '未知错误';
};
```

## HTTP 错误码映射

```ts
export const HTTP_ERROR_MAP: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求资源不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
};
```
