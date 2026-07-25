# hooks — Hooks 生成技能

> 本技能生成 useTable、useForm、usePagination、useRequest 等通用 hooks。

---

## usePagination

```ts
// composables/usePagination.ts
import { computed } from 'vue';

export function usePagination(total: Ref<number>, query: Ref<{ pageNum: number; pageSize: number }>, onChange: () => void) {
  const pagination = computed(() => ({
    current: query.value.pageNum,
    pageSize: query.value.pageSize,
    total: total.value,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (t: number) => `共 ${t} 条`,
    onChange: (page: number, size: number) => {
      query.value.pageNum = page;
      query.value.pageSize = size;
      onChange();
    },
  }));

  return { pagination };
}
```

## useRequest

```ts
// composables/useRequest.ts
export function useRequest<T>(api: () => Promise<T>) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref('');

  const execute = async () => {
    loading.value = true;
    error.value = '';
    try {
      data.value = await api();
    } catch (e: any) {
      error.value = e.message || '请求失败';
    } finally {
      loading.value = false;
    }
  };

  return { data, loading, error, execute };
}
```
