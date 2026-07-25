# store — 状态管理生成技能

> 本技能生成 Pinia/Zustand Store 模板。

---

## Pinia Store 模板

```ts
// store/{module}.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/api/{module}';

export const useXxxStore = defineStore('xxx', () => {
  const list = ref<XxxVO[]>([]);
  const loading = ref(false);

  async function fetchList(query: XxxQuery) {
    loading.value = true;
    try {
      const res = await api.getXxxPage(query);
      list.value = res.list;
    } finally {
      loading.value = false;
    }
  }

  async function create(dto: XxxCreateDTO) {
    const item = await api.createXxx(dto);
    list.value.unshift(item);
  }

  async function remove(id: string) {
    await api.deleteXxx(id);
    list.value = list.value.filter((item) => item.id !== id);
  }

  return { list, loading, fetchList, create, remove };
});
```

---

## 在页面中使用 Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const { token, userInfo, isLogin } = storeToRefs(userStore);

const handleLogin = async () => {
  await userStore.loginAction(username, password);
};
</script>
```
