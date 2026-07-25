# cache — 本地缓存生成技能

> 本技能生成 Storage 封装与缓存策略代码。

---

## 过期缓存封装

```ts
// utils/cache.ts
interface CacheItem<T> {
  data: T;
  expireAt: number;
}

export const cache = {
  set<T>(key: string, data: T, ttlMs = 30 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      expireAt: Date.now() + ttlMs,
    };
    uni.setStorageSync('app_' + key, JSON.stringify(item));
  },

  get<T>(key: string): T | null {
    const raw = uni.getStorageSync('app_' + key);
    if (!raw) return null;
    try {
      const item = JSON.parse(raw) as CacheItem<T>;
      if (Date.now() > item.expireAt) {
        uni.removeStorageSync('app_' + key);
        return null;
      }
      return item.data;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    uni.removeStorageSync('app_' + key);
  },
};
```

---

## 搜索历史管理

```ts
// utils/searchHistory.ts
const HISTORY_KEY = 'app_search_history';
const MAX_HISTORY = 20;

export const getHistory = (): string[] => cache.get<string[]>(HISTORY_KEY) || [];

export const addHistory = (keyword: string) => {
  const list = getHistory().filter((s) => s !== keyword);
  list.unshift(keyword);
  cache.set(HISTORY_KEY, list.slice(0, MAX_HISTORY), Infinity);
};

export const clearHistory = () => cache.remove(HISTORY_KEY);
```
