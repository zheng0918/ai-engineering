# router — 路由规范

> 本文件规定 Vue Router 路由配置、导航守卫与权限控制的约束。

---

## 1. 路由配置（按模块拆分）

```ts
// router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/pages/dashboard/index.vue'), meta: { title: '仪表盘', icon: 'Odometer' } },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/error/404.vue'),
    meta: { hidden: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
```

---

## 2. 路由模块拆分

```ts
// router/modules/user.ts
import type { RouteRecordRaw } from 'vue-router';

const userRoutes: RouteRecordRaw = {
  path: '/user',
  name: 'User',
  redirect: '/user/list',
  meta: { title: '用户管理', icon: 'User' },
  children: [
    {
      path: 'list',
      name: 'UserList',
      component: () => import('@/pages/user/list.vue'),
      meta: { title: '用户列表', permission: 'user:list' },
    },
    {
      path: 'detail/:id',
      name: 'UserDetail',
      component: () => import('@/pages/user/detail.vue'),
      meta: { title: '用户详情', hidden: true, activeMenu: '/user/list' },
    },
  ],
};

export default userRoutes;
```

---

## 3. 导航守卫（token 校验 + 权限 + 进度条）

```ts
// router/guard.ts
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import router from './index';
import { useUserStore } from '@/store/user';
import { usePermissionStore } from '@/store/permission';

const WHITE_LIST = ['/login', '/404'];

router.beforeEach(async (to, _from, next) => {
  NProgress.start();

  const userStore = useUserStore();

  if (userStore.token) {
    if (to.path === '/login') {
      next('/');
    } else {
      // 首次进入 → 获取用户信息 + 生成动态路由
      if (!userStore.userInfo) {
        await userStore.fetchUserInfo();
        const permissionStore = usePermissionStore();
        const routes = permissionStore.generateRoutes(userStore.permissions);
        routes.forEach((r) => router.addRoute(r));
        next({ ...to, replace: true });
      } else {
        next();
      }
    }
  } else {
    WHITE_LIST.includes(to.path) ? next() : next(`/login?redirect=${to.path}`);
  }
});

router.afterEach(() => {
  NProgress.done();
});
```

---

## 4. 路由 meta 规范

```ts
interface RouteMeta {
  title: string;          // 页面标题（用于面包屑 + document.title）
  icon?: string;          // 侧边栏图标（Element Plus icon 名）
  hidden?: boolean;       // 是否在侧边栏隐藏
  permission?: string;    // 权限标识
  keepAlive?: boolean;    // 是否缓存
  activeMenu?: string;    // 高亮菜单路径（详情页用）
  roles?: string[];       // 允许的角色
}
```

---

## 5. 禁止事项

- ❌ 所有路由写在一个文件（超过 15 条必须拆分模块）
- ❌ 路由懒加载不用动态 import
- ❌ 无导航守卫（token 过期不跳登录）
- ❌ 路由 meta 无 title
