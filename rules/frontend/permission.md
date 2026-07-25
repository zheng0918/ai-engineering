# permission — 权限控制规范

> 本文件规定前端 RBAC 权限（路由权限 + 按钮权限）的实现约束。

---

## 1. 路由权限

```ts
// store/permission.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { asyncRoutes } from '@/router/modules/async';
import type { RouteRecordRaw } from 'vue-router';

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([]);
  const cachedViews = ref<string[]>([]);

  /**
   * 根据用户权限列表过滤动态路由。
   * @param permissions 后端返回的权限标识数组
   */
  function generateRoutes(permissions: string[]) {
    const filterRoutes = (list: RouteRecordRaw[]): RouteRecordRaw[] =>
      list.filter((route) => {
        if (route.meta?.permission && !permissions.includes(route.meta.permission as string)) {
          return false;
        }
        if (route.children) route.children = filterRoutes(route.children);
        // 收集需要缓存的路由
        if (route.meta?.keepAlive && route.children?.length === 0) {
          cachedViews.value.push(route.name as string);
        }
        return true;
      });

    routes.value = filterRoutes(asyncRoutes);
    return routes.value;
  }

  function clearCache() {
    routes.value = [];
    cachedViews.value = [];
  }

  return { routes, cachedViews, generateRoutes, clearCache };
});
```

---

## 2. 按钮权限指令

```ts
// directives/permission.ts
import { useUserStore } from '@/store/user';
import type { Directive } from 'vue';

/**
 * v-permission 指令。
 * 用法：<el-button v-permission="'user:create'">新增</el-button>
 */
export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const userStore = useUserStore();
    if (value && !userStore.permissions.includes(value as string)) {
      el.parentNode?.removeChild(el);
    }
  },
};
```

```ts
// main.ts 注册
import { permission } from '@/directives/permission';
app.directive('permission', permission);
```

---

## 3. 权限标识规范

```
{module}:{resource}:{action}

system:user:list
system:user:create
system:user:update
system:user:delete
goods:list
order:export
```

---

## 4. 禁止事项

- ❌ 前端判断权限用角色名（应用权限标识）
- ❌ 隐藏按钮但不禁用后端接口（后端也必须校验）
- ❌ 权限标识硬编码
