# pagination — 分页对接生成技能

> 本技能生成三端分页相关代码，确保参数命名与数据结构完全对齐。

---

## 触发条件

当需要"添加分页"、"对接分页参数"、"生成列表页"时触发。

---

## 生成清单

- 后端：确认 `PageQuery` 基类 + `PageResult` 响应类
- 前端：`useTable` hook 调用 + 分页组件绑定
- 小程序：分页加载逻辑（刷新 + 加载更多）

---

## 后端 PageQuery 模板

```java
package com.example.model.base;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class PageQuery {

    @Min(value = 1, message = "页码最小为 1")
    private Long pageNum = 1L;

    @Min(value = 1, message = "每页条数最小为 1")
    @Max(value = 100, message = "每页条数最大为 100")
    private Long pageSize = 10L;
}
```

---

## 后端 XxxQuery 模板

```java
package com.example.model.query;

import com.example.model.base.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserQuery extends PageQuery {

    private String keyword;
    private String status;
    private String startDate;
    private String endDate;
}
```

---

## 前端 useTable 调用模板

```vue
<script setup lang="ts">
import { useTable } from '@/composables/useTable';
import { getUserPage } from '@/api/modules/user';
import type { UserVO, UserQuery } from '@/api/types/user';

const { state, fetchData } = useTable<UserVO>(getUserPage, {});

onMounted(() => fetchData());
</script>

<template>
  <el-table v-loading="state.loading" :data="state.list" border>
    <!-- columns -->
  </el-table>

  <el-pagination
    v-model:current-page="state.query.pageNum"
    v-model:page-size="state.query.pageSize"
    :total="state.total"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next, jumper"
    @current-change="() => fetchData()"
    @size-change="() => fetchData(true)"
  />
</template>
```

---

## 小程序分页模板（uniapp）

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getGoodsList } from '@/api/goods';
import type { GoodsVO } from '@/types/goods';

const list = ref<GoodsVO[]>([]);
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const finished = ref(false);
const keyword = ref('');

const fetchList = async (reset = false) => {
  if (reset) { pageNum.value = 1; list.value = []; finished.value = false; }
  if (loading.value || finished.value) return;
  loading.value = true;
  try {
    const res = await getGoodsList({ pageNum: pageNum.value, pageSize: pageSize.value, keyword: keyword.value });
    if (reset) list.value = res.list;
    else list.value = [...list.value, ...res.list];
    total.value = res.total;
    if (list.value.length >= total.value) finished.value = true;
  } catch {
    if (!reset) pageNum.value--; // 加载失败回退页码
  } finally {
    loading.value = false;
  }
};

const onSearch = () => fetchList(true);

onMounted(() => fetchList());
</script>

<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input v-model="keyword" placeholder="搜索" @confirm="onSearch" />
    </view>

    <!-- 列表 -->
    <view v-if="list.length > 0" class="list">
      <view v-for="item in list" :key="item.id" class="card">...</view>
    </view>
    <PageState v-else-if="!loading" type="empty" />

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-more">加载中...</view>
    <view v-else-if="finished && list.length > 0" class="no-more">— 没有更多了 —</view>
  </view>
</template>
```

---

## 分页对接 Checklist

- [ ] 后端 `PageQuery` 字段：`pageNum`(Long) + `pageSize`(Long)
- [ ] 后端 `PageResult` 字段：`pageNum`(long) + `pageSize`(long) + `total`(long) + `list`(List)
- [ ] 前端 query 对象字段名：`pageNum` + `pageSize`（与后端一致）
- [ ] 前端分页组件 `current-page` → `pageNum`，`page-size` → `pageSize`
- [ ] 前端 size-change 时 `fetchData(true)` 重置到第 1 页
- [ ] 前端搜索/筛选时 `fetchData(true)` 重置到第 1 页
- [ ] 小程序 `pageNum`/`pageSize` 变量名与后端一致
- [ ] 小程序下拉刷新重置数据 + pageNum=1
- [ ] 小程序触底加载 pageNum++ + 追加数据
- [ ] 小程序 `list.length >= total` 时停止加载

---

## 生成时注意事项

1. **字段名绝不能改**：`pageNum`/`pageSize`/`total`/`list` 必须一字不差
2. **默认值一致**：后端/前端/小程序默认 `pageSize` 都是 10
3. **reset 逻辑**：搜索、筛选、tab 切换都必须 `fetchData(true)`
4. **小程序加载失败回退页码**：触底加载失败时 pageNum-- 防页码偏移
5. **防重复请求**：`loading` 为 true 时拦截重复请求
