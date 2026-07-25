# cache — 本地缓存规范

> 本文件规定 localStorage / sessionStorage 的使用约束。

---

## 1. Storage Key 规范

```ts
// config/storage.ts
export const STORAGE_KEYS = {
  TOKEN: 'app_token',
  USER_INFO: 'app_user_info',
  SIDEBAR_COLLAPSED: 'app_sidebar_collapsed',
  THEME: 'app_theme',
  TAGS_VIEW: 'app_tags_view',
} as const;
```

**必须统一前缀 `app_`**。

---

## 2. 过期缓存封装

```ts
// utils/storage.ts
interface CacheItem<T> {
  data: T;
  expireAt: number;
}

export const storage = {
  set<T>(key: string, data: T, ttlMs?: number): void {
    const item: CacheItem<T> = { data, expireAt: ttlMs ? Date.now() + ttlMs : 0 };
    localStorage.setItem('app_' + key, JSON.stringify(item));
  },

  get<T>(key: string): T | null {
    const raw = localStorage.getItem('app_' + key);
    if (!raw) return null;
    try {
      const item = JSON.parse(raw) as CacheItem<T>;
      if (item.expireAt && Date.now() > item.expireAt) {
        localStorage.removeItem('app_' + key);
        return null;
      }
      return item.data;
    } catch { return null; }
  },

  remove(key: string): void { localStorage.removeItem('app_' + key); },

  clear(): void { localStorage.clear(); },
};
```

---

## 3. 禁止事项

- ❌ 敏感数据（密码/身份证）存 Storage
- ❌ Key 不加前缀
- ❌ 大 JSON（>1MB）存 Storage
