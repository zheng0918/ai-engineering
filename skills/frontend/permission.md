# permission — 权限生成技能

> 本技能生成路由权限过滤 + 按钮权限指令。

---

## 生成清单

- `store/permission.ts` — 动态路由生成
- `directives/permission.ts` — `v-permission` 指令

## 使用示例

```vue
<!-- 按钮权限 -->
<el-button v-permission="'user:create'" type="primary" @click="openCreate">新增</el-button>

<!-- 表格列权限 -->
<el-table-column v-if="hasPermission('user:delete')" label="操作">
  <template #default="{ row }">
    <el-button v-permission="'user:delete'" @click="handleDelete(row.id)">删除</el-button>
  </template>
</el-table-column>
```

```ts
// 函数式权限判断
import { useUserStore } from '@/store/user';

export const hasPermission = (perm: string): boolean => {
  const userStore = useUserStore();
  // admin 角色拥有所有权限
  if (userStore.userInfo?.role === 'admin') return true;
  return userStore.permissions.includes(perm);
};
```
