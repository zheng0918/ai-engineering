# layout — 布局生成技能

> 本技能生成 DefaultLayout + Sidebar + Navbar + TagsView 布局组件。

---

## 生成清单

- `layouts/DefaultLayout.vue` — 主布局
- `layouts/BlankLayout.vue` — 空白布局
- `layouts/components/Sidebar.vue` — 侧边栏（含菜单递归 + 折叠）
- `layouts/components/Navbar.vue` — 顶栏（面包屑 + 用户头像 + 退出）
- `layouts/components/TagsView.vue` — 标签页导航

## BlankLayout

```vue
<template>
  <router-view />
</template>
```
