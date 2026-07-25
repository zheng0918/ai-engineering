# store — 状态管理规范

> 本文件规定小程序状态管理的选型与使用约束。uniapp 使用 Pinia，taro 使用 Zustand。

---

## 1. Pinia Store 模板（uniapp）

```ts
// store/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, getUserInfo } from '@/api/auth';
import type { UserVO } from '@/types/user';

/**
 * 用户状态管理。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>('');
  const userInfo = ref<UserVO | null>(null);

  const isLogin = computed(() => !!token.value);

  /** 登录 */
  async function loginAction(username: string, password: string) {
    const res = await login({ username, password });
    token.value = res.token;
    uni.setStorageSync('token', res.token);
    await fetchUserInfo();
  }

  /** 获取用户信息 */
  async function fetchUserInfo() {
    userInfo.value = await getUserInfo();
  }

  /** 退出登录 */
  function logout() {
    token.value = '';
    userInfo.value = null;
    uni.removeStorageSync('token');
    uni.reLaunch({ url: '/pages/tab/home/index' });
  }

  /** 初始化（从 Storage 恢复 token） */
  function init() {
    const saved = uni.getStorageSync('token');
    if (saved) token.value = saved;
  }

  return { token, userInfo, isLogin, loginAction, fetchUserInfo, logout, init };
});
```

---

## 2. Zustand Store 模板（taro）

```ts
// store/user.ts
import { create } from 'zustand';
import { login, getUserInfo } from '@/api/auth';
import Taro from '@tarojs/taro';

interface UserState {
  token: string;
  userInfo: UserVO | null;
  isLogin: boolean;
  loginAction: (username: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  token: '',
  userInfo: null,
  isLogin: false,

  loginAction: async (username, password) => {
    const res = await login({ username, password });
    Taro.setStorageSync('token', res.token);
    const info = await getUserInfo();
    set({ token: res.token, userInfo: info, isLogin: true });
  },

  logout: () => {
    Taro.removeStorageSync('token');
    set({ token: '', userInfo: null, isLogin: false });
  },

  init: () => {
    const saved = Taro.getStorageSync('token');
    if (saved) set({ token: saved, isLogin: true });
  },
}));
```

---

## 3. Store 拆分原则

| Store | 职责 | 框架 |
|------|------|------|
| `app` | 全局状态：系统信息、网络状态、全局配置 | 通用 |
| `user` | 用户状态：token、用户信息、登录态 | 通用 |
| `{module}` | 业务模块状态：跨页面共享的业务数据 | 通用 |

---

## 4. 禁止事项

- ❌ Store 中直接操作 DOM / 页面实例
- ❌ token 不持久化（每次启动需重新登录）
- ❌ 大对象长期存在 Store 不清理
- ❌ 跨页面数据通过 URL 参数传递（应用 Store）
