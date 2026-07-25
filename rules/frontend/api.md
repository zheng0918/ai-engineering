# api — 接口请求规范

> 本文件规定 Axios 封装、拦截器与 API 模块拆分的约束。

---

## 1. Axios 封装（必须）

```ts
// api/request.ts
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import type { R } from './types/common';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 30000,
});

// 请求拦截器
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const userStore = useUserStore();
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`;
  }
  return config;
});

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse<R<any>>) => {
    const { code, message, data } = response.data;

    if (code === 0) return data;

    // token 失效
    if (code === 2004) {
      ElMessage.error('登录已失效，请重新登录');
      useUserStore().logout();
      return Promise.reject(new Error(message));
    }

    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message));
  },
  (error) => {
    ElMessage.error('网络异常，请稍后重试');
    return Promise.reject(error);
  },
);

export default http;
```

---

## 2. 通用响应类型

```ts
// api/types/common.ts
export interface R<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

export interface PageResult<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  list: T[];
}
```

---

## 3. API 模块拆分

```ts
// api/modules/user.ts
import http from '../request';
import type { UserVO, UserQuery, UserCreateDTO } from '../types/user';

export const getUserPage = (query: UserQuery) =>
  http.get<PageResult<UserVO>>('/api/v1/users', { params: query });

export const getUserDetail = (id: string) =>
  http.get<UserVO>(`/api/v1/users/${id}`);

export const createUser = (dto: UserCreateDTO) =>
  http.post<UserVO>('/api/v1/users', dto);

export const updateUser = (id: string, dto: Partial<UserCreateDTO>) =>
  http.put<UserVO>(`/api/v1/users/${id}`, dto);

export const deleteUser = (id: string) =>
  http.delete(`/api/v1/users/${id}`);
```

---

## 4. 上传文件

```ts
// api/modules/upload.ts
import http from '../request';

export const uploadFile = (file: File, onProgress?: (pct: number) => void) => {
  const form = new FormData();
  form.append('file', file);
  return http.post<{ url: string }>('/api/v1/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};
```

---

## 5. 禁止事项

- ❌ 页面中直接 `axios.get`（必须用封装的 `http`）
- ❌ API URL 硬编码在各页面
- ❌ 无请求/响应类型定义
- ❌ 不处理 token 过期
