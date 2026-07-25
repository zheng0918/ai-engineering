# cache — 本地缓存生成技能

> 本技能生成 Storage 封装（含 TTL 过期）与缓存策略代码。

---

## 生成清单

- `utils/storage.ts` — 过期缓存工具
- `config/storage.ts` — Storage Key 常量

## useStorage Hook

```ts
// composables/useStorage.ts
import { ref, watch } from 'vue';
import { storage } from '@/utils/storage';

export function useStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(storage.get<T>(key) ?? defaultValue);

  watch(data, (val) => storage.set(key, val), { deep: true });

  return data;
}
```
