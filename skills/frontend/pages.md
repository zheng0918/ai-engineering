# pages — 页面生成技能

> 本技能生成列表页、详情页、表单页。

---

## 列表页核心结构

```
搜索区（el-card + el-form inline）
表格区（el-table + el-pagination）
弹窗区（新增/编辑 Dialog）
```

> **⚠️ 四态使用规则：列表页禁止用 `v-if/v-else-if/v-else` 全页替换。**
>
> - loading → `el-table` 的 `v-loading` 属性（叠加遮罩层）
> - empty → `el-table` 的 `<template #empty>` 插槽（嵌入表格内部）
> - error → 仅替换 `<el-table>` 区域，**搜索栏/标题/按钮/分页器始终渲染**

### 列表页四态模板（正确写法）

```vue
<template>
  <div class="list-page">
    <!-- 搜索区 + 新增按钮 — 始终可见 -->
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

      <!-- error 态 — 仅替换表格区域，表头按钮保留 -->
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

      <!-- normal 态（含 empty） — el-table 始终存在 -->
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
          <!-- empty 态 — 嵌入 el-table，不替换页面 -->
          <template #empty>
            <el-empty description="暂无数据" />
          </template>
        </el-table>

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

## 详情页模板（仅限详情页）

> **⚠️ 以下 `v-if/v-else-if/v-else` 全页替换模式仅适用于详情页。列表页禁止使用此模式（见上方列表页模板）。**

```vue
<template>
  <div class="detail-page" v-loading="loading">
    <el-descriptions v-if="detail" :title="detail.name" :column="2" border>
      <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="statusType">{{ detail.status }}</el-tag>
      </el-descriptions-item>
    </el-descriptions>
    <el-empty v-else-if="!error" description="暂无数据" />
    <el-result v-else status="error" sub-title="加载失败">
      <template #extra><el-button @click="fetchDetail">重新加载</el-button></template>
    </el-result>
  </div>
</template>
```

---

## 与后端对接

| 前端 | 后端 |
|---|---|
| `getUserPage(query)` | `GET /api/v1/users` → `R<PageResult<UserVO>>` |
| `query.pageNum` / `query.pageSize` | `PageQuery` |
| `UserVO.id` (string) | `@JsonSerialize(ToStringSerializer) Long id` |
