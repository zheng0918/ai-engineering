# authorization — 登录鉴权规范

> 本文件规定前端登录、token 管理与路由鉴权的约束。

---

## 1. 登录流程

```
1. 用户输入用户名密码
2. 调 POST /api/v1/auth/login → 获取 token
3. token 存 localStorage + Pinia store
4. Axios 拦截器注入 Bearer token
5. 路由守卫检查 token → 放行/跳登录
```

---

## 2. 登录页面

```vue
<template>
  <div class="login-page">
    <div class="login-card">
      <h2>{{ APP_CONFIG.name }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password @keyup.enter="onLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" @click="onLogin">登 录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loading = ref(false);

const form = reactive({ username: 'admin', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const onLogin = async () => {
  const formRef = ref();
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await userStore.loginAction(form.username, form.password);
    ElMessage.success('登录成功');
    router.push((route.query.redirect as string) || '/');
  } catch {
    // 错误已由拦截器统一处理
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  @include flex-center;
  height: 100vh;
  background: linear-gradient(135deg, $primary 0%, lighten($primary, 20%) 100%);
}
.login-card {
  width: 400px;
  padding: $spacing-xxl $spacing-xl;
  background: $bg-white;
  border-radius: $radius-lg;
  box-shadow: $shadow-light;
  h2 { text-align: center; margin-bottom: $spacing-xl; }
}
.login-btn { width: 100%; }
</style>
```

---

## 3. 退出登录

```ts
// store/user.ts
function logout() {
  token.value = '';
  userInfo.value = null;
  permissions.value = [];
  removeToken();
  router.push('/login');
  // 清理缓存的页面
  permissionStore.clearCache();
}
```

---

## 4. 记住密码

```ts
// utils/auth.ts
const REMEMBER_KEY = 'app_remember';

export const getRemembered = (): { username: string; password: string } | null => {
  const raw = localStorage.getItem(REMEMBER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setRemembered = (username: string, password: string) => {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, password }));
};

export const removeRemembered = () => localStorage.removeItem(REMEMBER_KEY);
```

---

## 5. 禁止事项

- ❌ 密码明文传输到后端（虽然 HTTPS 加密，前端不做额外处理）
- ❌ token 存 sessionStorage（关闭标签页即失效）
- ❌ 退出登录不清除 localStorage
