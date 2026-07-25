# cache — 本地缓存规范

> 本文件规定小程序 Storage 缓存的使用约束。

---

## 1. Storage 类型

| API | 持久化 | 容量 | 适用 |
|---|---|---|---|
| `uni.setStorageSync` | 是（除非卸载） | 10MB | token、用户偏好 |
| `uni.setStorage` | 是 | 10MB | 大数据异步写入 |
| 全局变量 / Pinia | 否（内存） | — | 跨页面临时数据 |

---

## 2. Storage Key 命名

```ts
const STORAGE_KEYS = {
  TOKEN: 'app_token',
  USER_INFO: 'app_user_info',
  SEARCH_HISTORY: 'app_search_history',
  CART_CHECKED: 'app_cart_checked',
  ADDRESS_DEFAULT: 'app_address_default',
} as const;
```

**必须加统一前缀 `app_`** 避免与第三方插件 key 冲突。

---

## 3. 缓存策略

| 数据类型 | 缓存时间 | 更新策略 |
|---|---|---|
| token | 永久（直到过期） | 登录写入 / 退出清除 |
| 用户信息 | 30 分钟 | 每次 `onShow` 检查过期则刷新 |
| 搜索历史 | 永久 | 最多保留 20 条 |
| 字典数据 | 1 小时 | 首次加载后缓存，下次优先读缓存 |
| 页面数据 | 5 分钟 | 列表页 onHide 时缓存，onShow 时恢复 |

---

## 4. 禁止事项

- ❌ 敏感数据明文存 Storage（token 可存，手机号/身份证不可）
- ❌ Storage key 不加前缀
- ❌ 超过 10MB 不清理
- ❌ Storage 当数据库用（大量数据应请求后端）
