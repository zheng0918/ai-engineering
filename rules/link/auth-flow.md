# auth-flow — 鉴权流程对接规范

> 本文件规定 JWT 鉴权在三端的统一流程约束，包括 token 生命周期管理、存储键名、传输方式、过期处理。

---

## 1. Token 生命周期总览

```
登录请求 → 后端校验用户 → 生成 JWT → 返回 token → 
前端/小程序存储 token → 每次请求注入 Authorization header → 
后端 JwtAuthFilter 校验 → 过期返回 2004 → 
前端/小程序拦截 2004 → 清除 token → 跳转登录页
```

---

## 2. Token 存储键名（三端必须一致）

| 端 | 存储方式 | 键名 |
|---|---|---|
| Backend | — | — |
| Frontend | `localStorage` | `token` |
| MiniProgram | `uni.setStorageSync` | `token` |

**规则：**
- 键名统一为 `token`（不允许 `accessToken`、`jwt`、`authToken` 等变体）
- 刷新 token（如果有）键名为 `refreshToken`
- 用户信息存储键名为 `userInfo`

---

## 3. 后端 JWT 生成与校验

### 3.1 登录接口

```java
@PostMapping("/login")
public R<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
    // 1. 校验用户名密码
    // 2. 生成 JWT token
    String token = jwtUtil.generate(user.getId(), user.getUsername());
    // 3. 返回
    LoginVO vo = new LoginVO();
    vo.setToken(token);
    vo.setUserInfo(userConverter.toVO(user));
    return R.success(vo);
}
```

### 3.2 登录响应结构

```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userInfo": {
      "id": "1",
      "username": "admin",
      "realName": "管理员",
      "roles": ["admin"]
    }
  }
}
```

### 3.3 JwtAuthFilter 白名单

```java
// 以下路径不校验 token
private static final List<String> WHITELIST = List.of(
    "/api/v1/login",
    "/api/v1/register",
    "/api/v1/public/**",
    "/swagger-ui/**",
    "/v3/api-docs/**",
    "/actuator/health"
);
```

---

## 4. 前端 Token 管理

### 4.1 Store 持久化

```ts
// store/user.ts
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const userInfo = ref<UserInfo | null>(null);

  const setToken = (val: string) => {
    token.value = val;
    localStorage.setItem('token', val);
  };

  const logout = () => {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    router.push('/login');
  };

  return { token, userInfo, setToken, logout };
});
```

### 4.2 Axios 请求拦截器 — Token 注入

```ts
http.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`;
  }
  return config;
});
```

### 4.3 Axios 响应拦截器 — Token 过期处理

```ts
http.interceptors.response.use(
  (response) => {
    const { code, message } = response.data;
    if (code === 0) return response.data;
    if (code === 2004) {
      ElMessage.error('登录已失效，请重新登录');
      useUserStore().logout();       // 清除 token → 跳转 /login
      return Promise.reject(new Error(message));
    }
    // 其他错误...
  },
);
```

### 4.4 路由守卫

```ts
// router/guard.ts
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  const whiteList = ['/login'];

  if (userStore.token) {
    if (to.path === '/login') {
      next('/');                    // 已登录 → 跳首页
    } else {
      next();
    }
  } else {
    if (whiteList.includes(to.path)) {
      next();                       // 白名单放行
    } else {
      next(`/login?redirect=${to.path}`);  // 未登录 → 跳登录（带 redirect）
    }
  }
});
```

---

## 5. 小程序 Token 管理

### 5.1 wx.login 对接流程

```
1. 用户点击登录按钮
2. 调用 wx.login() 获取 code
3. 将 code 发送到后端 POST /api/v1/login/wx
4. 后端换取 openid/unionid → 查用户 → 生成 JWT token
5. 前端存储 token + userInfo
```

### 5.2 Store 持久化

```ts
// store/user.ts
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(uni.getStorageSync('token') || '');
  const userInfo = ref<UserInfo | null>(null);

  const setToken = (val: string) => {
    token.value = val;
    uni.setStorageSync('token', val);
  };

  const logout = () => {
    token.value = '';
    userInfo.value = null;
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');
    uni.reLaunch({ url: '/pages/login/index' });
  };

  return { token, userInfo, setToken, logout };
});
```

### 5.3 请求拦截 — Token 注入

```ts
// api/request.ts
header: {
  'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
}
```

### 5.4 响应拦截 — Token 过期

```ts
if (code === 2004) {
  useUserStore().logout();  // 清除 token + reLaunch 登录页
  reject(new Error('登录已失效'));
}
```

---

## 6. Token 刷新策略（可选，推荐）

| 策略 | 说明 |
|---|---|
| 无刷新 | token 过期直接跳登录（简单场景） |
| 静默刷新 | 过期前用 refreshToken 换新 token |
| 双 token | accessToken（短期）+ refreshToken（长期） |

**如启用刷新：**
- `refreshToken` 存储键名统一
- 刷新接口 `POST /api/v1/auth/refresh`
- 刷新失败清除所有 token 跳登录

---

## 7. 三端鉴权对照表

| 环节 | 后端 | Frontend | MiniProgram |
|---|---|---|---|
| 登录接口 | `POST /api/v1/login` | `login(dto)` | `wx.login()` → `loginByWx(code)` |
| Token 存储 | — | `localStorage.setItem('token')` | `uni.setStorageSync('token')` |
| Token 注入 | `JwtAuthFilter` 从 Header 读取 | `config.headers.Authorization` | `header.Authorization` |
| Token 校验 | `JwtUtil.verify(token)` | — | — |
| 过期错误码 | `2004` | 响应拦截器 2004 → logout | 响应拦截器 2004 → logout |
| 登出 | — | `localStorage.removeItem('token')` | `uni.removeStorageSync('token')` |
| 白名单 | `Filter 配置` | `router whiteList` | `登录页不拦截` |

---

## 8. 禁止事项

- ❌ Token 存储键名不一致（不允许 accessToken/jwt/authToken）
- ❌ 前端 token 存储在 sessionStorage（关闭标签页不影响）
- ❌ 小程序 token 不持久化（每次打开都要登录）
- ❌ 未登录请求不跳转登录页
- ❌ 登录成功后不带 redirect 参数回跳
- ❌ JWT secret 硬编码在代码中（必须环境变量）
- ❌ Token 过期不处理导致请求堆积报错
- ❌ 小程序登录不调用 wx.login（直接用手机号登录也要先 wx.login）
