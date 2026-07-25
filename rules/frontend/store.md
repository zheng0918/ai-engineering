# store — 状态管理规范

> 本文件规定 Pinia（Vue 3）/ Zustand（React）状态管理的使用约束。

---

## 1. Pinia Store 模板（Vue 3）

```ts
// store/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, getUserInfo } from '@/api/modules/auth';
import { getToken, setToken, removeToken } from '@/utils/auth';
import router from '@/router';
import type { UserVO } from '@/api/types/user';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getToken() || '');
  const userInfo = ref<UserVO | null>(null);
  const permissions = ref<string[]>([]);

  const isLogin = computed(() => !!token.value);

  async function loginAction(username: string, password: string) {
    const res = await login({ username, password });
    token.value = res.token;
    setToken(res.token);
    await fetchUserInfo();
  }

  async function fetchUserInfo() {
    const info = await getUserInfo();
    userInfo.value = info;
    permissions.value = info.permissions || [];
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    permissions.value = [];
    removeToken();
    router.push('/login');
  }

  return { token, userInfo, permissions, isLogin, loginAction, fetchUserInfo, logout };
});
```

---

## 2. Store 拆分原则

| Store | 职责 |
|---|---|
| `app` | 全局状态：sidebar 折叠、语言、主题、系统信息 |
| `user` | 用户状态：token、用户信息、权限列表 |
| `permission` | 权限状态：动态路由生成、菜单列表 |
| `{module}` | 业务模块状态：跨组件共享的数据 |

---

## 3. 使用规范

```vue
<script setup lang="ts">
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const { token, userInfo, isLogin } = storeToRefs(userStore);
// 方法直接解构：userStore.logout()
</script>
```

---

## 4. 禁止事项

- ❌ 响应式数据解构不用 `storeToRefs`（丢失响应性）
- ❌ token 不持久化
- ❌ Store 中直接操作 DOM
- ❌ 所有状态放一个 Store
