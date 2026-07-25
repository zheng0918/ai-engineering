# router — 路由与导航规范

> 本文件规定小程序路由配置、导航守卫与路径常量的约束。

---

## 1. 路由配置

### uniapp — pages.json

所有页面路径必须在 `pages.json` 中声明，分包按业务模块组织。

### taro — app.config.ts

```ts
export default defineAppConfig({
  pages: ['pages/index/index'],
  subPackages: [
    { root: 'pages/goods', pages: ['list/index', 'detail/index'] },
  ],
});
```

---

## 2. 路由路径常量（必须）

禁止在代码中硬编码路径字符串。在所有页面使用路径常量：

```ts
// config/routes.ts
export const PAGES = {
  // Tab
  HOME: '/pages/tab/home/index',
  CATEGORY: '/pages/tab/category/index',
  CART: '/pages/tab/cart/index',
  MINE: '/pages/tab/mine/index',

  // 商品
  GOODS_LIST: '/pages/goods/list/index',
  GOODS_DETAIL: '/pages/goods/detail/index',

  // 订单
  ORDER_LIST: '/pages/order/list/index',
  ORDER_DETAIL: '/pages/order/detail/index',

  // 用户
  LOGIN: '/pages/user/login/index',
  ADDRESS: '/pages/user/address/index',
} as const;
```

---

## 3. 导航方法封装

```ts
// utils/navigate.ts
import { PAGES } from '@/config/routes';

/** 保留当前页跳转 */
export const navTo = (url: string, params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  uni.navigateTo({ url: url + query });
};

/** 关闭当前页跳转 */
export const redirectTo = (url: string, params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  uni.redirectTo({ url: url + query });
};

/** 切换 Tab */
export const switchTab = (url: string) => {
  uni.switchTab({ url });
};

/** 返回 */
export const navBack = (delta = 1) => {
  uni.navigateBack({ delta });
};
```

---

## 4. 路由守卫

```ts
// router/index.ts
import { useUserStore } from '@/store/user';

// 需要登录的页面前缀列表
const AUTH_PATHS = [
  '/pages/order/',
  '/pages/user/address',
];

// uniapp 路由拦截
uni.addInterceptor('navigateTo', {
  invoke(args) {
    const userStore = useUserStore();
    const needAuth = AUTH_PATHS.some((p) => args.url.startsWith(p));
    if (needAuth && !userStore.isLogin) {
      uni.navigateTo({ url: PAGES.LOGIN });
      return false; // 阻止跳转
    }
  },
});
```

---

## 5. 禁止事项

- ❌ 路径字符串硬编码（必须用 `PAGES` 常量）
- ❌ 跳过路由守卫直接跳转需登录页面
- ❌ 使用 `uni.reLaunch` 代替 `uni.switchTab` 切换 Tab
