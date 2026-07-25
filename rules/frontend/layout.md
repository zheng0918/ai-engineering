# layout — 布局规范

> 本文件规定页面布局组件的设计约束。

---

## 1. 布局类型

| 布局 | 使用场景 | 组件 |
|---|---|---|
| DefaultLayout | 登录后的管理页面 | 侧边栏 + 顶栏 + 内容区 |
| BlankLayout | 登录页/404 等 | 无侧边栏/顶栏 |

---

## 2. DefaultLayout 模板

```vue
<template>
  <el-container class="app-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="app-layout__aside">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header class="app-layout__header" height="60px">
        <Navbar />
      </el-header>
      <el-main class="app-layout__main">
        <TagsView />
        <div class="app-layout__content">
          <router-view v-slot="{ Component, route }">
            <keep-alive :include="cachedViews">
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/app';
import Sidebar from './components/Sidebar.vue';
import Navbar from './components/Navbar.vue';
import TagsView from './components/TagsView.vue';
import { usePermissionStore } from '@/store/permission';

const appStore = useAppStore();
const permissionStore = usePermissionStore();

const isCollapse = computed(() => appStore.sidebarCollapsed);
const cachedViews = computed(() => permissionStore.cachedViews);
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;

  &__aside { background: $bg-white; border-right: 1px solid $border-light; transition: width 0.3s; overflow: hidden; }

  &__header { background: $bg-white; border-bottom: 1px solid $border-light; display: flex; align-items: center; padding: 0 $spacing-xl; }

  &__main { background: $bg-page; overflow-y: auto; }

  &__content { padding: $spacing-xl; min-height: calc(100vh - 120px); }
}
</style>
```

---

## 3. Sidebar 组件模板

```vue
<template>
  <div class="sidebar">
    <div class="sidebar__logo">
      <img src="@/assets/images/logo.png" />
      <span v-show="!isCollapse">{{ APP_CONFIG.name }}</span>
    </div>
    <el-menu :default-active="activeMenu" :collapse="isCollapse" router>
      <template v-for="menu in menus" :key="menu.path">
        <el-sub-menu v-if="menu.children" :index="menu.path">
          <template #title>
            <el-icon><component :is="menu.meta.icon" /></el-icon>
            <span>{{ menu.meta.title }}</span>
          </template>
          <el-menu-item v-for="child in menu.children" :key="child.path" :index="child.path">
            {{ child.meta.title }}
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item v-else :index="menu.path">
          <el-icon><component :is="menu.meta.icon" /></el-icon>
          <span>{{ menu.meta.title }}</span>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>
```

---

## 4. 禁止事项

- ❌ 两种以上布局混用
- ❌ 布局中引入业务组件（布局只负责框架）
- ❌ keep-alive 不设置 `max` 上限
