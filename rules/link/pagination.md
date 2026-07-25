# pagination — 分页对接规范

> 本文件规定三端分页参数的命名、传递、组件配置的约束，确保后端 PageQuery ↔ 前端分页组件 ↔ 小程序列表分页完全对齐。

---

## 1. 后端分页基类（权威定义）

```java
// model/base/PageQuery.java
@Data
public class PageQuery {
    @Min(1)
    private Long pageNum = 1L;      // 当前页码，从 1 开始

    @Min(1) @Max(100)
    private Long pageSize = 10L;    // 每页条数，最大 100
}
```

**规则：**
- 字段名固定为 `pageNum` / `pageSize`，不允许 `page`/`page_size`/`current`/`size` 等变体
- 默认值：`pageNum=1, pageSize=10`
- `pageSize` 最大值 100（防刷）

---

## 2. 后端分页响应

```java
// common/result/PageResult.java
@Data
public class PageResult<T> {
    private long pageNum;      // 当前页码
    private long pageSize;     // 每页条数
    private long total;        // 总记录数
    private List<T> list;      // 当前页数据
}
```

**前端/小程序收到的 JSON：**
```json
{
  "code": 0,
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "total": 100,
    "list": [...]
  }
}
```

---

## 3. 前端 TypeScript 类型

```ts
// api/types/common.ts
export interface PageResult<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  list: T[];
}

export interface PageQuery {
  pageNum: number;
  pageSize: number;
}
```

---

## 4. 前端 useTable Hook 对接

```ts
// composables/useTable.ts — 分页状态与后端完全对齐
export function useTable<T>(fetchApi: (query: any) => Promise<PageResult<T>>, initialQuery = {}) {
  const state = reactive({
    loading: false,
    list: [] as T[],
    total: 0,
    query: { pageNum: 1, pageSize: 10, ...initialQuery },
  });

  const fetchData = async (resetPage = false) => {
    if (resetPage) state.query.pageNum = 1;
    state.loading = true;
    try {
      const res = await fetchApi({ ...state.query });
      state.list = res.list;
      state.total = res.total;
    } finally {
      state.loading = false;
    }
  };

  return { state, fetchData, /* ... */ };
}
```

**关键约束：**
- `state.query` 的 `pageNum`/`pageSize` 字段名与后端 `PageQuery` 严格一致
- `fetchApi` 接收整个 `query` 对象传参，不做字段重命名
- 搜索/筛选时 `resetPage = true`，将 `pageNum` 重置为 1

---

## 5. 前端分页组件绑定（Element Plus）

```vue
<el-pagination
  v-model:current-page="state.query.pageNum"
  v-model:page-size="state.query.pageSize"
  :total="state.total"
  :page-sizes="[10, 20, 50, 100]"
  layout="total, sizes, prev, pager, next, jumper"
  @current-change="() => fetchData()"
  @size-change="() => fetchData(true)"
/>
```

**规则：**
- `current-page` 绑定 `pageNum`（不是 `page`）
- `page-size` 绑定 `pageSize`（不是 `size`）
- `size-change` 时重置到第 1 页（`fetchData(true)`）
- `page-sizes` 选项最大不超过 100（与后端 maxPageSize 一致）

---

## 6. 前端分页组件绑定（Ant Design Vue）

```vue
<a-pagination
  v-model:current="state.query.pageNum"
  v-model:page-size="state.query.pageSize"
  :total="state.total"
  :page-size-options="['10', '20', '50', '100']"
  show-size-changer
  show-quick-jumper
  :show-total="(total: number) => `共 ${total} 条`"
  @change="() => fetchData()"
  @showSizeChange="() => fetchData(true)"
/>
```

---

## 7. 小程序分页逻辑（uniapp）

```ts
// pages/goods/list/index.vue
const list = ref<GoodsVO[]>([]);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const finished = ref(false);

const fetchList = async (reset = false) => {
  if (reset) { pageNum.value = 1; list.value = []; finished.value = false; }
  if (loading.value || finished.value) return;
  loading.value = true;
  try {
    const res = await getGoodsList({ pageNum: pageNum.value, pageSize: pageSize.value, ...filters });
    if (reset) list.value = res.list;
    else list.value.push(...res.list);
    total.value = res.total;
    if (list.value.length >= res.total) finished.value = true;
  } finally {
    loading.value = false;
  }
};

// 下拉刷新
const onPullDownRefresh = async () => {
  await fetchList(true);
  uni.stopPullDownRefresh();
};

// 触底加载更多
const onReachBottom = () => {
  if (!finished.value) { pageNum.value++; fetchList(); }
};
```

**规则：**
- 分页参数名必须为 `pageNum` / `pageSize`
- 下拉刷新重置列表 + pageNum=1
- 触底加载 pageNum++ 并追加数据
- `list.length >= total` 时标记 finished，停止加载

---

## 8. 分页参数对照表

| 概念 | 后端 | 前端 Vue | 前端 React | 小程序 |
|---|---|---|---|---|
| 当前页 | `pageNum` | `state.query.pageNum` | `state.query.pageNum` | `pageNum` |
| 每页条数 | `pageSize` | `state.query.pageSize` | `state.query.pageSize` | `pageSize` |
| 总记录数 | `total` | `state.total` | `state.total` | `total` |
| 当前页数据 | `list` | `state.list` | `state.list` | `list` |
| 默认条数 | 10 | 10 | 10 | 10 |
| 最大条数 | 100 | 100 | 100 | 100 |
| 页容量选项 | — | [10,20,50,100] | [10,20,50,100] | — |

---

## 9. 禁止事项

- ❌ 后端用 `page` 代替 `pageNum`
- ❌ 后端用 `size` 代替 `pageSize`
- ❌ 前端 query 对象中重命名分页字段（如 `{ page: pageNum }`）
- ❌ 分页响应用 `records` 代替 `list`
- ❌ 小程序分页用 `offset`/`limit` 代替 `pageNum`/`pageSize`
- ❌ `pageSize` 无上限（必须限制 ≤100）
- ❌ 前端 size-change 时不重置 pageNum
- ❌ 搜索/筛选时不重置 pageNum 为 1
