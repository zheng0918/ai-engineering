# api — 接口请求规范

> 本文件规定小程序 API 请求层的封装、拦截器与模块拆分约束。

---

## 1. 请求封装（必须）

禁止裸用 `uni.request` / `wx.request`，必须统一封装拦截器：

```ts
// api/request.ts
import { useUserStore } from '@/store/user';

const BASE_URL = import.meta.env.VITE_API_BASE || 'https://api.example.com';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
  header?: Record<string, string>;
  showLoading?: boolean;
}

const request = <T = any>(options: RequestOptions): Promise<T> => {
  const userStore = useUserStore();

  if (options.showLoading !== false) {
    uni.showLoading({ title: '加载中', mask: true });
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
        ...options.header,
      },
      success: (res) => {
        const { code, message, data } = res.data as { code: number; message: string; data: T };
        if (code === 0) {
          resolve(data);
        } else if (code === 2004) {
          // token 失效 → 跳转登录
          userStore.logout();
          uni.reLaunch({ url: '/pages/tab/mine/index' });
          reject(new Error(message));
        } else {
          reject(new Error(message || '请求失败'));
        }
      },
      fail: (err) => {
        reject(new Error('网络异常，请稍后重试'));
      },
      complete: () => {
        if (options.showLoading !== false) {
          uni.hideLoading();
        }
      },
    });
  });
};

export default request;
```

---

## 2. API 模块拆分

按业务模块拆分 API 文件：

```ts
// api/goods.ts
import request from './request';
import type { GoodsVO, GoodsDetailVO, GoodsQuery } from '@/types/goods';

/** 商品列表 */
export const getGoodsList = (query: GoodsQuery) =>
  request<{ list: GoodsVO[]; total: number }>({
    url: '/api/v1/goods',
    data: query,
  });

/** 商品详情 */
export const getGoodsDetail = (id: string) =>
  request<GoodsDetailVO>({
    url: `/api/v1/goods/${id}`,
  });
```

---

## 3. 请求/响应类型定义

```ts
// types/goods.ts
export interface GoodsVO {
  id: string;
  title: string;
  image: string;
  price: string;
  sales: number;
}

export interface GoodsQuery {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  categoryId?: string;
}
```

---

## 4. 禁止事项

- ❌ 页面中直接 `uni.request` / `wx.request`
- ❌ API URL 硬编码在各页面
- ❌ 请求不加 Loading 状态管理
- ❌ token 过期不处理
- ❌ 无请求/响应类型定义
