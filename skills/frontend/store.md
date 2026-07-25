# store — 状态管理生成技能

> 本技能生成 Pinia Store 模板。

---

## Pinia Store 模板

```ts
// store/{module}.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/api/modules/{module}';

export const useXxxStore = defineStore('xxx', () => {
  const list = ref<XxxVO[]>([]);
  const loading = ref(false);

  async function fetchList(query: XxxQuery) {
    loading.value = true;
    try {
      const data = await api.getXxxPage(query);
      list.value = data.list;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function create(dto: XxxCreateDTO) {
    const item = await api.createXxx(dto);
    list.value.unshift(item);
    return item;
  }

  async function remove(id: string) {
    await api.deleteXxx(id);
    list.value = list.value.filter((i) => i.id !== id);
  }

  return { list, loading, fetchList, create, remove };
});
```
