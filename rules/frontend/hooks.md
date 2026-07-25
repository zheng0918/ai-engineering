# hooks — 组合式函数规范

> 本文件规定 Vue 3 Composables（hooks）的编写约束。

---

## 1. Hooks 命名

所有 hooks 以 `use` 开头：`useAuth`、`useTable`、`usePagination`、`useForm`、`useRequest`

---

## 2. useTable（列表页通用 hook）

```ts
// composables/useTable.ts
import { ref, reactive } from 'vue';
import type { PageResult } from '@/api/types/common';

interface TableState<T> {
  loading: boolean;
  list: T[];
  total: number;
  query: { pageNum: number; pageSize: number };
}

export function useTable<T>(fetchApi: (query: any) => Promise<PageResult<T>>, initialQuery = {}) {
  const state = reactive<TableState<T>>({
    loading: false,
    list: [],
    total: 0,
    query: { pageNum: 1, pageSize: 10, ...initialQuery },
  });

  const fetchData = async (resetPage = false) => {
    if (resetPage) state.query.pageNum = 1;
    state.loading = true;
    try {
      const res = await fetchApi(state.query);
      state.list = res.list as any;
      state.total = res.total;
    } finally {
      state.loading = false;
    }
  };

  const onSearch = () => fetchData(true);
  const onPageChange = (page: number, size?: number) => {
    state.query.pageNum = page;
    if (size) state.query.pageSize = size;
    fetchData();
  };

  return { state, fetchData, onSearch, onPageChange };
}
```

---

## 3. useForm（表单通用 hook）

```ts
// composables/useForm.ts
import { reactive, ref, type Ref } from 'vue';
import type { FormInstance } from 'element-plus';

export function useForm<T extends Record<string, any>>(
  initial: T,
  submitApi: (data: T) => Promise<any>,
) {
  const formRef = ref<FormInstance>();
  const form = reactive<T>({ ...initial });
  const submitting = ref(false);

  const resetForm = () => {
    formRef.value?.resetFields();
    Object.assign(form, initial);
  };

  const submit = async (): Promise<boolean> => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return false;
    submitting.value = true;
    try {
      await submitApi({ ...form } as T);
      ElMessage.success('操作成功');
      return true;
    } catch (e: any) {
      ElMessage.error(e.message || '操作失败');
      return false;
    } finally {
      submitting.value = false;
    }
  };

  return { formRef, form, submitting, resetForm, submit };
}
```

---

## 4. 禁止事项

- ❌ hooks 中直接操作 DOM
- ❌ hooks 返回值不用 reactive/ref 包装
- ❌ 列表页不抽 useTable（重复代码）
