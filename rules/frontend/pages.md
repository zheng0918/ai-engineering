# pages — 页面开发规范

> 本文件规定前端页面的结构、状态覆盖与数据流约束。
>
> **优先级声明**：本文件定义的页面容器结构（`el-card`）为通用默认。当 spec 文档或原型 HTML 定义了不同的容器结构（如 `.panel` 体系），以 spec/原型为准。

---

## 1. 页面模板（列表页）

```vue
<template>
  <div class="user-list">
    <!-- 搜索区 -->
    <el-card class="search-card">
      <el-form :model="query" inline>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="用户名/姓名" clearable @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="openCreate">新增用户</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="姓名" />
        <el-table-column prop="role" label="角色" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @change="fetchData"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <UserFormDialog ref="formDialogRef" @success="fetchData(true)" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { getUserPage, deleteUser } from '@/api/modules/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import UserFormDialog from './components/UserFormDialog.vue';
import type { UserVO } from '@/api/types/user';

const list = ref<UserVO[]>([]);
const total = ref(0);
const loading = ref(false);
const formDialogRef = ref<InstanceType<typeof UserFormDialog>>();

const query = reactive({ keyword: '', pageNum: 1, pageSize: 10 });

const fetchData = async (resetPage = false) => {
  if (resetPage) query.pageNum = 1;
  loading.value = true;
  try {
    const res = await getUserPage(query);
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => fetchData(true);
const onReset = () => { query.keyword = ''; fetchData(true); };
const openCreate = () => formDialogRef.value?.open();
const openEdit = (row: UserVO) => formDialogRef.value?.open(row.id);

const handleDelete = async (id: string) => {
  await ElMessageBox.confirm('确认删除该用户？', '提示', { type: 'warning' });
  await deleteUser(id);
  ElMessage.success('删除成功');
  fetchData(true);
};

onMounted(() => fetchData());
</script>
```

---

## 2. 页面状态规范

每个页面必须覆盖以下状态。**列表页与详情页的呈现方式不同：**

| 状态 | 列表页展示 | 详情页展示 |
|------|----------|----------|
| loading | `v-loading` 叠加在表格上（**表头/按钮/分页始终可见**） | `v-if` 全页 `<el-skeleton>` |
| empty | `el-table` 的 `<template #empty>` 插槽（**不能隐藏表格/分页**） | `<el-empty>` 全页替换 |
| error | `<el-result>` 内嵌在表格区域，搜索栏/表头保留 | `<el-result>` 全页替换 + 重试按钮 |
| normal | 完整列表渲染 | 正常数据展示 |

> **⚠️ 列表页禁止使用 `v-if/v-else-if/v-else` 全页替换四态！**
>
> 列表页的核心特征（搜索区、表头、分页器、操作按钮）必须始终渲染。`v-if` 会把它们全部隐藏，
> 导致用户在 loading/error/empty 时看不到任何页面结构。正确做法：
> - loading → `el-table` 的 `v-loading` 属性
> - empty → `el-table` 的 `#empty` 插槽
> - error → `v-if="error"` 仅替换表格区域，不隐藏搜索栏和标题
>
> **详情页**才可以使用 `v-if/v-else-if/v-else` 全页替换（因为详情实体可能不存在）。

---

## 3. 禁止事项

- ❌ 页面无 loading 状态
- ❌ 列表页用 `v-if="!loading && list.length === 0"` 隐藏整个表格区域
- ❌ 列表页 empty 用全页 `<el-empty>` 替换表格/搜索栏/分页器
- ❌ 列表不分页
- ❌ 删除无二次确认
- ❌ 操作无结果 toast
- ❌ 搜索按钮不带 `@keyup.enter`
- ❌ 表单不校验直接提交
