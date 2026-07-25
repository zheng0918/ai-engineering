# state-mapping — 状态映射规范

> 本文件规定三端页面 UI 状态（loading/error/empty/normal）与操作反馈状态的统一约束。

---

## 1. 页面四态模型

```
         ┌─────────────────────────┐
         │       页面初始化         │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │      LOADING 加载中      │  ← 显示骨架屏/loading 动画
         └───────────┬─────────────┘
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
    ┌─────────────┐  ┌─────────────┐
    │ ERROR 加载失败│  │ 请求成功     │
    └──────┬──────┘  └──────┬──────┘
           │                │
           │ 点击重试        ├──────┐
           │                │      │
           └────► LOADING   │      │
                            ▼      ▼
                   ┌─────────────┐ ┌─────────────┐
                   │ EMPTY 空数据 │ │ NORMAL 正常  │
                   └─────────────┘ └─────────────┘
```

**规则：**
- **只有 LOADING 结束才能判定 ERROR/EMPTY/NORMAL**
- **EMPTY 和 NORMAL 可以互相转换**（搜索/筛选后）
- **ERROR 点击重试回到 LOADING**
- **每个页面必须覆盖四种状态**

---

## 2. 状态变量规范

```ts
// 列表页
const loading = ref(true);    // 初始 true → 请求完成后 false
const error = ref(false);     // 请求失败时 true
const list = ref<T[]>([]);    // 空数组 = 初始 / 搜索无结果

// 详情页
const loading = ref(true);
const error = ref(false);
const detail = ref<T | null>(null);
```

**状态判定逻辑：**

| 状态 | loading | error | list.length / detail | 显示内容 |
|---|---|---|---|---|
| LOADING | `true` | — | — | 骨架屏 / Loading 动画 |
| ERROR | `false` | `true` | — | 错误提示 + 重试按钮 |
| EMPTY | `false` | `false` | `0` / `null` | 空数据插画 + 提示文案 |
| NORMAL | `false` | `false` | `> 0` / 非 null | 正常内容 |

---

## 3. 列表页 vs 详情页 — 状态呈现方式区分

> **⚠️ 关键区分：列表页和详情页的四态呈现方式完全不同，禁止混用！**

| 页面类型 | Loading 方式 | Empty 方式 | Error 方式 | 核心原则 |
|---------|-------------|-----------|-----------|---------|
| **列表页** | `v-loading` 叠加在表格上 | `el-table` 的 `#empty` 插槽 | `<el-result>` 内嵌在内容区 | **表头/按钮/分页始终可见** |
| **详情页** | `v-if` 全页骨架屏 | `<el-empty>` 全页替换 | `<el-result>` 全页替换 | **实体不存在时可全页替换** |

**核心规则：列表页禁止使用 `v-if` 通过控制四态来隐藏表格/搜索区/分页器。列表页的 empty 必须在 `el-table` 内部呈现。**

### 3.1 列表页状态模板（正确写法）

```vue
<template>
  <div class="list-page">
    <!-- 搜索区和操作按钮 — 始终可见 -->
    <el-card class="search-card">
      <el-form :model="query" inline>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="搜索" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>列表</span>
        <el-button type="primary" @click="openAdd">新增</el-button>
      </template>

      <!-- error 态 — 显示在表格位置，但不隐藏表头按钮区域 -->
      <el-result
        v-if="error"
        status="error"
        title="加载失败"
        sub-title="请检查网络后重试"
      >
        <template #extra>
          <el-button type="primary" @click="fetchData">重新加载</el-button>
        </template>
      </el-result>

      <!-- normal + empty 态 — el-table 始终渲染，empty 用内置插槽 -->
      <template v-else>
        <el-table v-loading="loading" :data="list" border stripe>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="status" label="状态" />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
          <!-- empty 态 — 嵌入 el-table 内部，不替换整个页面 -->
          <template #empty>
            <el-empty description="暂无数据" :image-size="120">
              <template #extra>
                <el-button type="primary" @click="openAdd">新增数据</el-button>
              </template>
            </el-empty>
          </template>
        </el-table>

        <!-- 分页 — 始终可见 -->
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @change="fetchData"
        />
      </template>
    </el-card>
  </div>
</template>
```

### 3.2 详情页状态模板（仅限详情页使用）

> **⚠️ 此 `v-if` 全页替换模式仅适用于详情页。列表页禁止使用此模式。**

```vue
<template>
  <div class="detail-page">
    <!-- LOADING — 全页骨架屏 -->
    <div v-if="loading" class="page-loading">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- ERROR — 全页错误 -->
    <el-result
      v-else-if="error"
      status="error"
      title="加载失败"
      sub-title="请检查网络后重试"
    >
      <template #extra>
        <el-button type="primary" @click="fetchDetail">重新加载</el-button>
      </template>
    </el-result>

    <!-- EMPTY — 详情实体不存在 -->
    <el-empty v-else-if="detail === null" description="该数据不存在或已被删除" />

    <!-- NORMAL -->
    <template v-else>
      <el-descriptions :title="detail.name" :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
      </el-descriptions>
    </template>
  </div>
</template>
```

---

## 4. 前端 PageState 通用组件

```vue
<!-- components/base/PageState/index.vue -->
<template>
  <!-- LOADING -->
  <div v-if="loading" class="page-state">
    <slot name="loading">
      <el-skeleton :rows="5" animated />
    </slot>
  </div>

  <!-- ERROR -->
  <div v-else-if="error" class="page-state">
    <slot name="error">
      <el-result status="error" title="加载失败" sub-title="请检查网络后重试">
        <template #extra>
          <el-button type="primary" @click="$emit('retry')">重新加载</el-button>
        </template>
      </el-result>
    </slot>
  </div>

  <!-- EMPTY -->
  <div v-else-if="isEmpty" class="page-state">
    <slot name="empty">
      <el-empty :description="emptyText || '暂无数据'" />
    </slot>
  </div>

  <!-- NORMAL -->
  <slot v-else />
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  error: boolean;
  isEmpty: boolean;
  emptyText?: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>
```

---

## 5. 小程序 PageState 通用组件

```vue
<!-- components/PageState/index.vue -->
<template>
  <!-- LOADING -->
  <view v-if="loading" class="page-state">
    <slot name="loading">
      <view class="loading-wrap">
        <uni-load-more status="loading" />
      </view>
    </slot>
  </view>

  <!-- ERROR -->
  <view v-else-if="error" class="page-state">
    <slot name="error">
      <view class="error-wrap">
        <text class="error-icon">!</text>
        <text class="error-text">{{ errorText || '加载失败' }}</text>
        <button class="retry-btn" @click="$emit('retry')">重新加载</button>
      </view>
    </slot>
  </view>

  <!-- EMPTY -->
  <view v-else-if="isEmpty" class="page-state">
    <slot name="empty">
      <view class="empty-wrap">
        <text class="empty-text">{{ emptyText || '暂无数据' }}</text>
      </view>
    </slot>
  </view>

  <!-- NORMAL -->
  <slot v-else />
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  error: boolean;
  isEmpty: boolean;
  errorText?: string;
  emptyText?: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>
```

---

## 6. 列表页使用模板

```vue
<!-- 前端 -->
<PageState
  :loading="state.loading"
  :error="error"
  :is-empty="state.list.length === 0"
  empty-text="暂无数据"
  @retry="fetchData(true)"
>
  <el-table :data="state.list">...</el-table>
</PageState>
```

```vue
<!-- 小程序 -->
<PageState
  :loading="loading"
  :error="error"
  :is-empty="list.length === 0"
  @retry="() => fetchList(true)"
>
  <view v-for="item in list" :key="item.id">...</view>
</PageState>
```

---

## 7. 操作反馈状态

### 7.1 提交操作

| 阶段 | 前端 | 小程序 |
|---|---|---|
| 提交中 | 按钮 loading + disabled | `uni.showLoading('提交中')` |
| 成功 | `ElMessage.success('操作成功')` + 刷新列表 | `uni.showToast({ title: '操作成功' })` + 返回/刷新 |
| 失败 | `ElMessage.error(message)` + 弹窗不关闭 | `uni.showToast({ title: message, icon: 'none' })` |

### 7.2 删除操作

| 阶段 | 前端 | 小程序 |
|---|---|---|
| 点击删除 | `ElMessageBox.confirm('确认删除？')` | `uni.showModal({ title: '确认删除？' })` |
| 确认后 | loading + 调用 API | loading + 调用 API |
| 成功 | toast + 刷新列表 | toast + 刷新列表 |
| 失败 | toast 错误信息 | toast 错误信息 |

### 7.3 表单校验

| 阶段 | 前端 | 小程序 |
|---|---|---|
| 校验失败 | 表单项标红 + 提示 | 表单项标红 + toast 第一条错误 |
| 校验通过 | 进入提交 loading | 进入提交 loading |

---

## 8. 三端状态对照表

| 状态 | 后端 | Frontend | MiniProgram |
|---|---|---|---|
| 加载中 | — | `el-skeleton` / `v-loading` | PageState loading 插槽 |
| 加载失败 | `R.fail(code, msg)` | `el-result` error + 重试按钮 | PageState error 插槽 + 重试 |
| 数据为空 | `R.success(PageResult{list:[]})` | `el-empty` | PageState empty 插槽 |
| 操作 loading | — | 按钮 `:loading` | `uni.showLoading` |
| 操作成功 | `R.success()` | `ElMessage.success` | `uni.showToast` |
| 操作失败 | `R.fail()` / BizException | `ElMessage.error` | `uni.showToast({ icon:'none' })` |
| 删除确认 | — | `ElMessageBox.confirm` | `uni.showModal` |

---

## 9. 禁止事项

- ❌ 页面无 loading 状态（白屏等待）
- ❌ 页面无 error 状态（加载失败后永远 loading）
- ❌ 页面无 empty 状态（空列表不提示用户）
- ❌ 操作无 loading 反馈（用户重复点击）
- ❌ 操作成功后不刷新列表
- ❌ 操作失败不提示原因（吞异常）
- ❌ 删除无二次确认
- ❌ 表单无校验反馈
- ❌ 错误状态不提供重试按钮
- ❌ 使用浏览器 `confirm()` / `alert()`（必须用 UI 库弹窗）
