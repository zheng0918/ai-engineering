# router — 路由生成技能

> 本技能生成 Vue Router 配置、模块化路由、导航守卫与权限路由。

---

## 动态路由生成（权限）

```ts
// router/modules/async.ts
// 所有需要权限的动态路由在此定义

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    name: 'System',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/pages/system/user/list.vue'),
        meta: { title: '用户管理', permission: 'system:user:list' },
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/pages/system/role/list.vue'),
        meta: { title: '角色管理', permission: 'system:role:list' },
      },
    ],
  },
];
```

## 路由守卫完整模板

```ts
// router/guard.ts
import NProgress from 'nprogress';
import router from './index';
import { useUserStore } from '@/store/user';
import { getToken } from '@/utils/auth';

const WHITE_LIST = ['/login'];

router.beforeEach(async (to, _from, next) => {
  NProgress.start();
  document.title = (to.meta.title as string) || '管理后台';

  if (getToken()) {
    if (to.path === '/login') { next('/'); return; }

    const userStore = useUserStore();
    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo();
        await userStore.generateDynamicRoutes();
        next({ ...to, replace: true });
      } catch {
        userStore.logout();
        next('/login');
      }
    } else {
      next();
    }
  } else {
    WHITE_LIST.includes(to.path) ? next() : next(`/login?redirect=${to.path}`);
  }
});

router.afterEach(() => NProgress.done());
```
