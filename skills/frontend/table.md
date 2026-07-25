# table — 表格生成技能

> 本技能生成 el-table 表格列配置、分页、操作列。

---

## 列配置动态生成

```ts
// config/columns/user.ts
import type { TableColumn } from '@/types/table';

export const userColumns: TableColumn[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'realName', label: '姓名', minWidth: 120 },
  { prop: 'role', label: '角色', width: 100 },
  {
    prop: 'status', label: '状态', width: 100, align: 'center',
    render: (val: string) => ({ type: val === 'ACTIVE' ? 'success' : 'danger', text: val === 'ACTIVE' ? '启用' : '停用' }),
  },
  { prop: 'createdAt', label: '创建时间', width: 180 },
];
```

---

## 通用表格组件（BaseTable）

```vue
<template>
  <div>
    <el-table v-loading="loading" :data="data" border stripe @selection-change="(rows) => $emit('selectionChange', rows)">
      <el-table-column v-if="showSelection" type="selection" width="50" />
      <el-table-column v-if="showIndex" type="index" label="#" width="60" />
      <template v-for="col in columns" :key="col.prop">
        <el-table-column v-bind="col">
          <template v-if="col.render" #default="{ row }">
            <el-tag v-if="col.render(row[col.prop]).type" :type="col.render(row[col.prop]).type" size="small">
              {{ col.render(row[col.prop]).text }}
            </el-tag>
          </template>
        </el-table-column>
      </template>
      <el-table-column v-if="showAction" label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <slot name="actions" :row="row" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
```
