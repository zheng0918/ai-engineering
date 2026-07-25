# api — 接口层生成技能

> 本技能根据 `rule.md` 约束生成 API 请求封装与模块文件。

---

## 请求拦截器完整模板

```ts
// api/request.ts
import { useUserStore } from '@/store/user';

const BASE_URL = import.meta.env.VITE_API_BASE;

interface R<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
  showLoading?: boolean;
  loadingText?: string;
}

const http = <T = any>(config: RequestConfig): Promise<T> => {
  const { url, method = 'GET', data, showLoading = true, loadingText = '加载中' } = config;

  if (showLoading) {
    uni.showLoading({ title: loadingText, mask: true });
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useUserStore().token}`,
      },
      success(res) {
        const body = res.data as R<T>;
        if (body.code === 0) {
          resolve(body.data);
        } else {
          uni.showToast({ title: body.message, icon: 'none' });
          reject(new Error(body.message));
        }
      },
      fail() {
        uni.showToast({ title: '网络异常', icon: 'none' });
        reject(new Error('网络异常'));
      },
      complete() {
        if (showLoading) uni.hideLoading();
      },
    });
  });
};

export default http;
```

---

## API 模块模板

```ts
// api/{module}.ts
import http from './request';
import type { XxxVO, XxxDetailVO, XxxQuery, XxxCreateDTO } from '@/types/{module}';

/** 分页列表 */
export const getXxxPage = (query: XxxQuery) =>
  http<{ list: XxxVO[]; total: number }>({ url: '/api/v1/xxx', data: query });

/** 详情 */
export const getXxxDetail = (id: string) =>
  http<XxxDetailVO>({ url: `/api/v1/xxx/${id}` });

/** 新增 */
export const createXxx = (dto: XxxCreateDTO) =>
  http<XxxVO>({ url: '/api/v1/xxx', method: 'POST', data: dto });

/** 更新 */
export const updateXxx = (id: string, dto: Partial<XxxCreateDTO>) =>
  http<XxxVO>({ url: `/api/v1/xxx/${id}`, method: 'PUT', data: dto });

/** 删除 */
export const deleteXxx = (id: string) =>
  http<void>({ url: `/api/v1/xxx/${id}`, method: 'DELETE' });
```

---

## 上传文件封装

```ts
// api/upload.ts
export const uploadFile = (filePath: string): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/api/v1/upload',
      filePath,
      name: 'file',
      header: { 'Authorization': `Bearer ${useUserStore().token}` },
      success(res) {
        const body = JSON.parse(res.data);
        if (body.code === 0) resolve(body.data);
        else reject(new Error(body.message));
      },
      fail() { reject(new Error('上传失败')); },
    });
  });
};
```
