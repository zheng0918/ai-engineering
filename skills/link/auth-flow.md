# auth-flow — 鉴权流程对接生成技能

> 本技能生成三端鉴权相关代码，确保登录 → token 存储 → 请求注入 → 过期处理全链路贯通。

---

## 触发条件

当需要"实现登录"、"添加鉴权"、"配置 token 管理"时触发。

---

## 生成清单

- 后端：`LoginController` + `LoginDTO` + `LoginVO`
- 前端：`store/user.ts` + 路由守卫 + 登录页
- 小程序：`store/user.ts` + `api/auth.ts` + 登录页

---

## 后端登录接口模板

```java
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LoginController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    @Operation(summary = "账号密码登录")
    public R<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        User user = userService.login(dto.getUsername(), dto.getPassword());
        String token = jwtUtil.generate(user.getId(), user.getUsername());
        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setUserInfo(userConverter.toLoginVO(user));
        return R.success(vo);
    }
}
```

---

## 前端 Store + 登录页模板

```ts
// store/user.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import router from '@/router';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const userInfo = ref<UserInfo | null>(
    (() => { try { return JSON.parse(localStorage.getItem('userInfo') || ''); } catch { return null; } })()
  );

  const setToken = (val: string) => {
    token.value = val;
    localStorage.setItem('token', val);
  };

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info;
    localStorage.setItem('userInfo', JSON.stringify(info));
  };

  const logout = () => {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    router.push('/login');
  };

  return { token, userInfo, setToken, setUserInfo, logout };
});
```

```vue
<!-- pages/login/index.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { login } from '@/api/modules/auth';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const form = ref({ username: '', password: '' });
const loading = ref(false);

const onSubmit = async () => {
  loading.value = true;
  try {
    const res = await login(form.value);
    userStore.setToken(res.token);
    userStore.setUserInfo(res.userInfo);
    router.push((route.query.redirect as string) || '/');
  } catch {
    // 错误已由拦截器提示
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 小程序 wx.login 对接模板

```ts
// api/auth.ts
import request from './request';

export const loginByWx = (code: string) =>
  request<LoginVO>({ url: '/api/v1/login/wx', method: 'POST', data: { code }, showLoading: true });
```

```vue
<!-- pages/login/index.vue -->
<script setup lang="ts">
import { useUserStore } from '@/store/user';
import { loginByWx } from '@/api/auth';

const userStore = useUserStore();
const loading = ref(false);

const onWxLogin = () => {
  loading.value = true;
  uni.login({
    provider: 'weixin',
    success: async (loginRes) => {
      try {
        const res = await loginByWx(loginRes.code);
        userStore.setToken(res.token);
        userStore.setUserInfo(res.userInfo);
        uni.reLaunch({ url: '/pages/index/index' });
      } catch {
        uni.showToast({ title: '登录失败，请重试', icon: 'none' });
      } finally {
        loading.value = false;
      }
    },
    fail: () => {
      loading.value = false;
      uni.showToast({ title: '微信授权失败', icon: 'none' });
    },
  });
};
</script>
```

---

## 生成时注意事项

1. **Token 存储键名统一用 `token`**：三端不允许变体
2. **登录成功后必须 redirect 回跳**：前端从 `route.query.redirect` 读取
3. **小程序 wx.login 先于所有业务请求**：获取 code 是调用微信支付等 API 的前置条件
4. **登出必须清除所有持久化数据**：token + userInfo + 其他 Store 状态
5. **白名单路径三端配置**：后端 Filter + 前端 router + 小程序 pages.json 都不拦截
6. **请求头格式固定**：`Authorization: Bearer {token}`（注意 Bearer 后有一个空格）
