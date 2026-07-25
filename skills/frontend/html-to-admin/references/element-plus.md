# Vue 3 + Element Plus 参考

将 HTML 原型转换为 Vue 3（Element Plus）管理后台时使用本参考。

---

## 文件结构

### 标准项目骨架

```
project/
├── src/
│   ├── layouts/
│   │   └── DefaultLayout.vue       # 侧边栏+顶栏+内容区+面包屑
│   ├── pages/                       # 业务页面（按路由分组）
│   │   ├── dashboard/
│   │   │   └── index.vue
│   │   └── system/
│   │       └── user/
│   │           ├── index.vue        # 用户列表
│   │           └── detail.vue       # 用户详情
│   ├── components/                  # 公共组件
│   │   ├── Sidebar.vue
│   │   ├── Header.vue
│   │   ├── MultiTabs.vue
│   │   └── ChartCard.vue            # 图表卡片容器
│   ├── stores/                      # Pinia stores
│   │   ├── app.ts                   # 侧边栏折叠、多标签页、面包屑
│   │   └── user.ts                  # 用户信息（占位）
│   ├── router/
│   │   └── index.ts
│   ├── utils/
│   │   ├── mock.ts                  # 所有 Mock 数据集中管理
│   │   └── echarts.ts              # ECharts 封装（按需引入）
│   ├── styles/
│   │   ├── variables.css            # 设计 Token (CSS Variables)
│   │   └── global.css               # 全局样式 + reset
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

---

## 一、项目初始化

### 1.1 Vite 脚手架

```bash
npm create vite@latest project -- --template vue-ts
cd project
```

### 1.2 依赖安装

```bash
# 核心依赖
npm install vue-router@4 pinia element-plus @element-plus/icons-vue

# ECharts（如有图表）
npm install echarts vue-echarts

# 开发依赖
npm install -D @types/node unplugin-auto-import unplugin-vue-components
```

### 1.3 Vite 配置（自动导入 Element Plus）

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

### 1.4 main.ts 入口

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './styles/global.css'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
```

---

## 二、设计 Token 注入

### 2.1 CSS Variables 定义

```css
/* src/styles/variables.css */
:root {
  /* ===== 主色 ===== */
  --color-primary: #409eff;
  --color-primary-light: #66b1ff;
  --color-primary-dark: #3a8ee6;

  /* ===== 功能色 ===== */
  --color-success: #67c23a;
  --color-warning: #e6a23c;
  --color-danger: #f56c6c;
  --color-info: #909399;

  /* ===== 中性色 ===== */
  --color-text-primary: #303133;
  --color-text-regular: #606266;
  --color-text-secondary: #909399;
  --color-text-placeholder: #c0c4cc;
  --color-border: #dcdfe6;
  --color-border-light: #e4e7ed;
  --color-bg-page: #f5f7fa;
  --color-bg-card: #ffffff;

  /* ===== 字号 ===== */
  --font-size-h1: 24px;
  --font-size-h2: 20px;
  --font-size-h3: 18px;
  --font-size-h4: 16px;
  --font-size-body: 14px;
  --font-size-small: 12px;

  /* ===== 间距 ===== */
  --spacing-page: 24px;
  --spacing-card: 20px;
  --spacing-section: 16px;
  --spacing-comp: 12px;
  --spacing-inline: 8px;

  /* ===== 圆角 ===== */
  --radius-card: 8px;
  --radius-button: 4px;
  --radius-input: 4px;
  --radius-dialog: 8px;

  /* ===== 阴影 ===== */
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-dialog: 0 4px 24px rgba(0, 0, 0, 0.12);
  --shadow-dropdown: 0 2px 12px rgba(0, 0, 0, 0.1);

  /* ===== 布局 ===== */
  --sidebar-width: 220px;
  --sidebar-collapsed-width: 64px;
  --header-height: 56px;
  --tabs-height: 40px;
}
```

### 2.2 Element Plus 主题覆盖

Element Plus 使用 CSS Variables 实现主题定制，直接在 `variables.css` 中覆盖：

```css
/* src/styles/variables.css（续） */
:root {
  /* 覆盖 Element Plus 默认主色 */
  --el-color-primary: var(--color-primary);
  --el-color-primary-light-3: var(--color-primary-light);
  --el-color-primary-dark-2: var(--color-primary-dark);

  /* 覆盖功能色 */
  --el-color-success: var(--color-success);
  --el-color-warning: var(--color-warning);
  --el-color-danger: var(--color-danger);
  --el-color-info: var(--color-info);

  /* 覆盖文本色 */
  --el-text-color-primary: var(--color-text-primary);
  --el-text-color-regular: var(--color-text-regular);
  --el-text-color-secondary: var(--color-text-secondary);
  --el-text-color-placeholder: var(--color-text-placeholder);

  /* 覆盖边框色 */
  --el-border-color: var(--color-border);
  --el-border-color-light: var(--color-border-light);

  /* 覆盖背景色 */
  --el-bg-color-page: var(--color-bg-page);
  --el-bg-color: var(--color-bg-card);

  /* 覆盖圆角 */
  --el-border-radius-base: var(--radius-input);
  --el-border-radius-round: 20px;

  /* 覆盖字号 */
  --el-font-size-large: var(--font-size-h4);
  --el-font-size-base: var(--font-size-body);
  --el-font-size-small: var(--font-size-small);
}
```

> [!TIP]
> Element Plus 支持的所有 CSS Variables 可查阅官方文档的 [CSS Variables 章节](https://element-plus.org/en-US/guide/theming.html)。如某些变量在 CSS Variables 中不可覆盖（如 `--el-menu-*`），需要在组件内部通过 `<style scoped>` 覆盖。

---

## 三、布局框架

### 3.1 DefaultLayout.vue（标准管理后台布局）

```vue
<!-- src/layouts/DefaultLayout.vue -->
<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <Sidebar
        :is-collapse="isCollapse"
        @toggle="toggleSidebar"
      />
    </el-aside>

    <!-- 右侧区域 -->
    <el-container>
      <!-- 顶栏 -->
      <el-header height="56px" class="layout-header">
        <Header
          :is-collapse="isCollapse"
          @toggle="toggleSidebar"
        />
      </el-header>

      <!-- 多标签页 -->
      <MultiTabs v-if="appStore.showTabs" />

      <!-- 面包屑 -->
      <div class="layout-breadcrumb">
        <el-breadcrumb>
          <el-breadcrumb-item
            v-for="item in breadcrumbItems"
            :key="item.path"
            :to="item.path"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 内容区 -->
      <el-main class="layout-content">
        <router-view />
      </el-main>

      <!-- 页脚 -->
      <el-footer v-if="showFooter" height="48px" class="layout-footer">
        <span>{{ footerText }}</span>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
import MultiTabs from '@/components/MultiTabs.vue'

const route = useRoute()
const appStore = useAppStore()
const isCollapse = ref(false)

const showFooter = ref(false)
const footerText = '© 2024 Company Name'

const breadcrumbItems = computed(() => {
  return route.matched
    .filter(item => item.meta?.title)
    .map(item => ({
      path: item.path,
      title: item.meta.title as string,
    }))
})

function toggleSidebar() {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.layout-aside {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
}
.layout-header {
  background: #fff;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-page);
}
.layout-breadcrumb {
  padding: var(--spacing-comp) var(--spacing-page);
  background: #fff;
}
.layout-content {
  background: var(--color-bg-page);
  padding: var(--spacing-page);
  overflow: auto;
}
.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  border-top: 1px solid var(--color-border-light);
}
</style>
```

### 3.2 Sidebar.vue（侧边栏组件）

```vue
<!-- src/components/Sidebar.vue -->
<template>
  <div class="sidebar">
    <!-- Logo 区 -->
    <div class="sidebar-logo">
      <img src="@/assets/logo.png" class="logo-img" />
      <span v-show="!isCollapse" class="logo-text">管理后台</span>
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :collapse-transition="false"
      background-color="#001529"
      text-color="#ffffffa6"
      active-text-color="#fff"
      router
      class="sidebar-menu"
    >
      <template v-for="item in menuItems" :key="item.path">
        <!-- 无子菜单 -->
        <el-menu-item v-if="!item.children" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>

        <!-- 有子菜单 -->
        <el-sub-menu v-else :index="item.path">
          <template #title>
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="child.path"
          >
            {{ child.title }}
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps<{ isCollapse: boolean }>()
defineEmits<{ toggle: [] }>()

const route = useRoute()
const activeMenu = computed(() => route.path)

interface MenuItem {
  path: string
  title: string
  icon: string
  children?: MenuItem[]
}

// 从蓝图路由树自动生成
const menuItems: MenuItem[] = [
  { path: '/dashboard', title: '仪表盘', icon: 'Odometer' },
  {
    path: '/system',
    title: '系统管理',
    icon: 'Setting',
    children: [
      { path: '/system/user', title: '用户管理', icon: 'User' },
      { path: '/system/role', title: '角色管理', icon: 'Avatar' },
    ],
  },
]
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
  white-space: nowrap;
}
.logo-img {
  width: 32px;
  height: 32px;
}
.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-left: 12px;
}
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none;
}
.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}
</style>
```

### 3.3 Header.vue（顶栏组件）

```vue
<!-- src/components/Header.vue -->
<template>
  <div class="header">
    <!-- 折叠按钮 -->
    <el-icon class="collapse-btn" @click="$emit('toggle')">
      <Fold v-if="!isCollapse" />
      <Expand v-else />
    </el-icon>

    <!-- 右侧操作区 -->
    <div class="header-actions">
      <el-icon class="action-icon"><Search /></el-icon>
      <el-icon class="action-icon"><Bell /></el-icon>

      <!-- 用户下拉 -->
      <el-dropdown>
        <span class="user-info">
          <el-avatar :size="32" icon="UserFilled" />
          <span class="username">管理员</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ isCollapse: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-comp);
}
.action-icon {
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-regular);
}
.action-icon:hover {
  color: var(--color-primary);
}
.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-inline);
  cursor: pointer;
}
.username {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
</style>
```

### 3.4 自定义布局注意事项

如果原型布局与标准布局差异较大（如无侧边栏、顶栏双行、侧边栏在右侧等），在 DefaultLayout 中灵活调整。关键原则：

- `el-container` 支持无限嵌套，通过 `direction` 属性切换横/竖排列
- 侧边栏非必须时可移除整个 `<el-aside>`
- 多标签页需要配合 Pinia 存储已打开的标签列表

---

## 四、路由配置

### 4.1 router/index.ts

```typescript
// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 扩展路由元信息类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    hidden?: boolean      // 是否在菜单中隐藏
    keepAlive?: boolean    // 是否缓存页面
    permission?: string    // 权限标识（占位）
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' },
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/user',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'user',
            name: 'UserList',
            component: () => import('@/pages/system/user/index.vue'),
            meta: { title: '用户管理', permission: 'system:user:list' },
          },
          {
            path: 'user/:id',
            name: 'UserDetail',
            component: () => import('@/pages/system/user/detail.vue'),
            meta: { title: '用户详情', hidden: true },
          },
          {
            path: 'role',
            name: 'RoleList',
            component: () => import('@/pages/system/role/index.vue'),
            meta: { title: '角色管理', permission: 'system:role:list' },
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫占位
router.beforeEach((to, _from, next) => {
  // TODO: 权限验证
  // const userStore = useUserStore()
  // if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
  //   next('/403')
  // }
  next()
})

export default router
```

### 4.2 页面跳转方法

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 普通跳转
function goDetail(id: number) {
  router.push(`/system/user/${id}`)
}

// 带查询参数跳转
function goWithQuery() {
  router.push({ path: '/system/user', query: { status: 'active' } })
}

// 新开标签页
function openInNewTab(path: string) {
  window.open(`/#${path}`, '_blank')
}

// 未实现功能占位
import { ElMessage } from 'element-plus'
function notImplemented() {
  ElMessage.info('功能开发中')
}
</script>
```

---

## 五、状态管理（Pinia）

### 5.1 app store（全局应用状态）

```typescript
// src/stores/app.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const showTabs = ref(true)

  // 多标签页
  interface TabItem {
    path: string
    title: string
  }
  const openedTabs = ref<TabItem[]>([])
  const activeTab = ref('')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addTab(tab: TabItem) {
    if (!openedTabs.value.find(t => t.path === tab.path)) {
      openedTabs.value.push(tab)
    }
    activeTab.value = tab.path
  }

  function removeTab(path: string) {
    const idx = openedTabs.value.findIndex(t => t.path === path)
    if (idx > -1) {
      openedTabs.value.splice(idx, 1)
    }
  }

  return {
    sidebarCollapsed,
    showTabs,
    openedTabs,
    activeTab,
    toggleSidebar,
    addTab,
    removeTab,
  }
})
```

### 5.2 user store（用户信息占位）

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('mock-token')
  const userInfo = ref({
    id: 1,
    name: '管理员',
    avatar: '',
    roles: ['admin'],
    permissions: ['*'],
  })

  const isLoggedIn = computed(() => !!token.value)

  function hasPermission(perm: string): boolean {
    if (userInfo.value.permissions.includes('*')) return true
    return userInfo.value.permissions.includes(perm)
  }

  return { token, userInfo, isLoggedIn, hasPermission }
})
```

---

## 六、组件映射

### 6.1 完整映射表

| HTML 原型 | Element Plus | 说明 |
|-----------|-------------|------|
| `<div>` `<section>` `<main>` `<article>` | `<div>` 保留 | Web 端不限标签 |
| `<header>` | `<el-header>` 或 `<div>` | 在 `el-container` 内时用 `el-header` |
| `<aside>` `<nav>` | `<el-menu>` 或 `<div>` | 侧边栏导航 |
| `<table>` `<thead>` `<tbody>` `<tr>` `<td>` `<th>` | `<el-table>` + `<el-table-column>` | 数据表格 |
| `<form>` | `<el-form>` | 表单容器 |
| `<input type="text">` | `<el-input>` | 文本输入 |
| `<input type="number">` | `<el-input-number>` | 数字输入 |
| `<input type="password">` | `<el-input type="password" show-password>` | 密码输入 |
| `<textarea>` | `<el-input type="textarea">` | 文本域 |
| `<select>` | `<el-select>` + `<el-option>` | 下拉选择 |
| `<input type="radio">` | `<el-radio-group>` + `<el-radio>` | 单选组 |
| `<input type="checkbox">` | `<el-checkbox-group>` + `<el-checkbox>` | 多选组 |
| `<button>` | `<el-button>` | 按钮（含 loading 状态） |
| `<button type="submit">` | `<el-button type="primary" native-type="submit">` | 提交按钮 |
| `<img>` | `<img>` 或 `<el-image>` | 后者支持预览和懒加载 |
| `<a href="...">` | `<router-link>` 或 `router.push` | 路由跳转 |
| `<a href="javascript:;">` | `<el-button link>` 或 `<span @click>` | 无跳转链接 |
| `<svg>` (图标) | `<el-icon>` + `<xxx />` | `@element-plus/icons-vue` |
| `<dialog>` `<div class="modal">` | `<el-dialog>` | 弹窗 |
| 下拉菜单 | `<el-dropdown>` + `<el-dropdown-menu>` | |
| 分页控件 | `<el-pagination>` | |
| Tabs 切换 | `<el-tabs>` + `<el-tab-pane>` | |
| 步骤条 | `<el-steps>` + `<el-step>` | |
| 侧边抽屉 | `<el-drawer>` | |
| 树形控件 | `<el-tree>` | |
| 文件上传 | `<el-upload>` | |
| 开关 | `<el-switch>` | |
| 滑块 | `<el-slider>` | |
| 日期选择 | `<el-date-picker>` | |
| 时间选择 | `<el-time-picker>` | |
| 级联选择 | `<el-cascader>` | |
| 穿梭框 | `<el-transfer>` | |
| 进度条 | `<el-progress>` | |
| 标签/徽标 | `<el-tag>` | |
| 头像 | `<el-avatar>` | |
| 骨架屏 | `<el-skeleton>` | |
| 空状态 | `<el-empty>` | |
| 描述列表 | `<el-descriptions>` + `<el-descriptions-item>` | |
| 统计数值 | `<el-statistic>` | Element Plus 2.4+ |
| 时间线 | `<el-timeline>` + `<el-timeline-item>` | |
| 折叠面板 | `<el-collapse>` + `<el-collapse-item>` | |
| 卡片容器 | `<el-card>` | |
| 走马灯/轮播 | `<el-carousel>` + `<el-carousel-item>` | |
| 确认弹窗 | `ElMessageBox.confirm()` | JS 调用 |
| 消息提示 | `ElMessage.success()` / `.warning()` / `.error()` | JS 调用 |
| 通知 | `ElNotification()` | JS 调用 |
| 评分 | `<el-rate>` | |
| 徽标/红点 | `<el-badge>` | |
| 文字提示 | `<el-tooltip>` | |
| 气泡卡片 | `<el-popover>` | |
| 水印 | `<el-watermark>` | Element Plus 2.4+ |
| 加载中 | `v-loading` 指令 / `<el-loading>` | |
| 无限滚动 | `v-infinite-scroll` 指令 | |
| 回到顶部 | `<el-backtop>` | |
| 分割线 | `<el-divider>` | |
| 水印 | `<el-watermark>` | Element Plus 2.4+ |
| 全局尺寸 | `<el-config-provider size="default">` | App.vue 包裹 |
| 弹窗表单 | `<el-dialog>` > `<el-form>` | 嵌套 |

### 6.2 表格映射详解

```vue
<!-- 原型: <table> + 筛选条件 -->
<template>
  <el-card class="page-card">
    <!-- 搜索表单 -->
    <el-form :model="searchForm" inline @submit.prevent="handleSearch">
      <el-form-item label="用户名">
        <el-input v-model="searchForm.username" placeholder="请输入" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择" clearable>
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="table-toolbar">
      <el-button type="primary" @click="handleAdd">新增</el-button>
      <el-button :disabled="!selectedRows.length" @click="handleBatchDelete">
        批量删除
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      border
      stripe
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" sortable="custom" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="table-pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="fetchData"
      />
    </div>
  </el-card>

  <!-- 新增/编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    @closed="resetForm"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status">
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitting">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>
```

### 6.3 描述列表映射

```vue
<!-- 原型: <table> 或 <dl>/<dt>/<dd> 键值对 -->
<el-descriptions :column="2" border>
  <el-descriptions-item label="用户名">张三</el-descriptions-item>
  <el-descriptions-item label="手机号">138****8888</el-descriptions-item>
  <el-descriptions-item label="邮箱">zhangsan@example.com</el-descriptions-item>
  <el-descriptions-item label="状态">
    <el-tag type="success">启用</el-tag>
  </el-descriptions-item>
  <el-descriptions-item label="备注" :span="2">
    这是一段备注信息
  </el-descriptions-item>
</el-descriptions>
```

### 6.4 统计卡片映射

```vue
<!-- 原型: 四个数字卡片（Dashboard 常见布局） -->
<el-row :gutter="16">
  <el-col :span="6" v-for="item in statsData" :key="item.title">
    <el-card shadow="never" class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <div class="stat-title">{{ item.title }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
        <div class="stat-icon" :style="{ background: item.color }">
          <el-icon size="24"><component :is="item.icon" /></el-icon>
        </div>
      </div>
    </el-card>
  </el-col>
</el-row>
```

---

## 七、ECharts 图表

### 7.1 ECharts 封装

```typescript
// src/utils/echarts.ts
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, GaugeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
])

export default echarts
```

### 7.2 图表组件封装（vue-echarts）

```vue
<!-- src/components/ChartCard.vue -->
<template>
  <el-card class="chart-card" :body-style="{ padding: '20px' }">
    <template #header>
      <span class="chart-title">{{ title }}</span>
    </template>
    <v-chart
      :option="option"
      :autoresize="true"
      :style="{ width: '100%', height: height + 'px' }"
    />
  </el-card>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'

defineProps<{
  title: string
  option: EChartsOption
  height?: number
}>()
</script>

<style scoped>
.chart-title {
  font-size: var(--font-size-h4);
  font-weight: 600;
}
</style>
```

### 7.3 常用图表 Option 模板

```typescript
// 柱状图
export const barOption: EChartsOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['销售额', '利润'] },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value' },
  series: [
    { name: '销售额', type: 'bar', data: [120, 200, 150, 80, 70, 110] },
    { name: '利润', type: 'bar', data: [30, 50, 40, 20, 15, 28] },
  ],
}

// 折线图
export const lineOption: EChartsOption = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五'] },
  yAxis: { type: 'value' },
  series: [{
    type: 'line',
    data: [820, 932, 901, 934, 1290],
    smooth: true,
  }],
}

// 饼图
export const pieOption: EChartsOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [
      { value: 1048, name: '搜索引擎' },
      { value: 735, name: '直接访问' },
      { value: 580, name: '邮件营销' },
      { value: 484, name: '联盟广告' },
      { value: 300, name: '视频广告' },
    ],
  }],
}
```

---

## 八、Mock 数据管理

```typescript
// src/utils/mock.ts

// ===== 仪表盘数据 =====
export const dashboardData = {
  stats: [
    { title: '总用户数', value: '12,846', icon: 'User', color: '#409eff' },
    { title: '总订单数', value: '8,234', icon: 'Document', color: '#67c23a' },
    { title: '销售额', value: '¥128,460', icon: 'Money', color: '#e6a23c' },
    { title: '转化率', value: '24.6%', icon: 'TrendCharts', color: '#f56c6c' },
  ],
}

export const barChartData = {
  series: [
    { name: '销售额', data: [120, 200, 150, 80, 70, 110] },
    { name: '利润', data: [30, 50, 40, 20, 15, 28] },
  ],
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
}

export const pieChartData = [
  { value: 1048, name: '搜索引擎' },
  { value: 735, name: '直接访问' },
  { value: 580, name: '邮件营销' },
  { value: 484, name: '联盟广告' },
  { value: 300, name: '视频广告' },
]

// ===== 用户管理数据 =====
export interface User {
  id: number
  username: string
  email: string
  status: 'active' | 'inactive'
  role: string
  createTime: string
}

export const userListData: User[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', status: 'active', role: '管理员', createTime: '2024-01-15 10:30' },
  { id: 2, username: 'zhangsan', email: 'zhangsan@example.com', status: 'active', role: '编辑', createTime: '2024-02-20 14:22' },
  { id: 3, username: 'lisi', email: 'lisi@example.com', status: 'inactive', role: '访客', createTime: '2024-03-10 09:15' },
  // ...
]

// ===== 角色管理数据 =====
export interface Role {
  id: number
  name: string
  code: string
  description: string
  permissions: string[]
  createTime: string
}

export const roleListData: Role[] = [
  { id: 1, name: '管理员', code: 'admin', description: '系统最高权限', permissions: ['*'], createTime: '2024-01-01 00:00' },
  { id: 2, name: '编辑', code: 'editor', description: '内容管理权限', permissions: ['content:*', 'user:view'], createTime: '2024-01-15 10:00' },
  // ...
]
```

**页面中引用：**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userListData, type User } from '@/utils/mock'

const tableData = ref<User[]>([])
const loading = ref(false)

onMounted(() => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    tableData.value = userListData
    loading.value = false
  }, 300)
})
</script>
```

---

## 九、图标方案

> [!IMPORTANT]
> 管理后台推荐使用组件库自带图标组件（风格统一、树摇优化）。需要补充图标时使用 **[Lucide](https://lucide.dev/)** — shadcn/ui 默认图标库，1000+ 极简线条风格图标。

### @element-plus/icons-vue（推荐）

```vue
<template>
  <el-icon size="18"><HomeFilled /></el-icon>
  <el-icon size="18"><Search /></el-icon>
  <el-icon size="18"><Setting /></el-icon>
</template>

<script setup lang="ts">
import { HomeFilled, Search, Setting } from '@element-plus/icons-vue'
</script>
```

### Lucide Vue（补充方案）

当 Element Plus Icons 缺少所需图标时，使用 `lucide-vue-next`：

```bash
npm install lucide-vue-next
```

```vue
<template>
  <BarChart3 :size="18" color="#94a3b8" />
  <MapPin :size="18" color="#94a3b8" />
</template>

<script setup lang="ts">
import { BarChart3, MapPin } from 'lucide-vue-next'
</script>
```

**常用图标映射参考：**

| 用途 | Element Plus Icon | Lucide 替代（无组件库时） |
|------|------------------|------------------------|
| 首页/Dashboard | `HomeFilled` | `house` |
| 用户 | `User` / `UserFilled` | `user-round` |
| 角色/权限 | `Avatar` | `shield` |
| 设置 | `Setting` | `settings` |
| 搜索 | `Search` | `search` |
| 编辑 | `Edit` | `pencil` |
| 删除 | `Delete` | `trash-2` |
| 新增 | `Plus` / `CirclePlus` | `plus` |
| 导出 | `Download` | `download` |
| 刷新 | `Refresh` | `refresh-cw` |
| 菜单折叠 | `Fold` / `Expand` | `panel-left-close` / `panel-left-open` |
| 通知 | `Bell` | `bell` |
| 全屏 | `FullScreen` | `maximize` |
| 关闭 | `Close` | `x` |
| 确认 | `Check` | `check` |
| 警告 | `Warning` | `triangle-alert` |
| 信息 | `InfoFilled` | `info` |
| 上传 | `Upload` | `upload` |
| 图片 | `Picture` | `image` |
| 文件 | `Document` | `file-text` |
| 日历 | `Calendar` | `calendar` |
| 位置 | `Location` | `map-pin` |
| 数据/图表 | `TrendCharts` | `bar-chart-3` |
| 金额 | `Money` | `dollar-sign` |
| 锁定 | `Lock` | `lock` |
| 可见 | `View` | `eye` |
| 不可见 | `Hide` | `eye-off` |
| 复制 | `CopyDocument` | `copy` |
| 链接 | `Link` | `link` |
| 消息 | `ChatDotRound` | `message-circle` |

---

## 十、事件映射

| Web 原型事件 | Vue 3 写法 | 说明 |
|-------------|-----------|------|
| `onclick` / `@click` | `@click="handler"` | 点击 |
| `onchange` (input) | `@input` / `v-model` | 输入变化 |
| `onchange` (select/checkbox) | `@change` / `v-model` | 值变化 |
| `onsubmit` | `@submit.prevent` | 表单提交 |
| `onfocus` | `@focus` | 获取焦点 |
| `onblur` | `@blur` | 失去焦点 |
| `onmouseenter` | `@mouseenter` | 鼠标进入 |
| `onmouseleave` | `@mouseleave` | 鼠标离开 |
| `onkeydown` / `onkeyup` | `@keydown` / `@keyup` | 键盘事件 |
| `onscroll` | `@scroll` | 滚动事件 |
| `onresize` | `window.addEventListener('resize')` | 窗口尺寸变化 |
| `Element Plus 组件事件` | `@change` `@visible-change` `@current-change` 等 | 查阅 Element Plus 文档 |

---

## 十一、常见陷阱

1. **`v-model` 与 Element Plus 组件的双向绑定**：大部分表单组件支持 `v-model`，但 `el-table` 的 `selection` 需用 `@selection-change` 手动管理
2. **`el-dialog` 的 `@closed` vs `@close`**：`@closed` 在动画完全结束后触发，适合重置表单；`@close` 在动画开始前触发
3. **`el-table` `v-loading` 指令**：需要绑定布尔值，不能直接在 `data` 函数返回的对象中使用
4. **异步组件与 `Suspense`**：路由懒加载页面如果需要 Loading 状态，在顶层包裹 `<Suspense>`
5. **Pinia store 在 `router.beforeEach` 中使用**：需要确保 `app.use(pinia)` 在 router 挂载之前调用
6. **Element Plus 图标按需引入**：使用 `unplugin-vue-components` 自动引入，或手动从 `@element-plus/icons-vue` 导入
7. **`el-menu` 的 `router` 属性**：启用后 `index` 值作为路由路径跳转，注意与 `vue-router` 路径一致
8. **ECharts 容器必须设置宽高**：否则图表不会渲染。使用 `autoresize` 属性实现响应式
9. **`el-form` 的 `rules` 校验**：`prop` 必须与 `v-model` 绑定的字段名一致
10. **CSS Variables 作用域**：在 `:root` 中定义，在 `<style scoped>` 中通过 `var()` 引用
11. **Vite 路径别名**：配置 `@` 指向 `src/`，同时更新 `tsconfig.json` 的 `paths`
12. **TypeScript 类型声明**：为 Mock 数据定义 Interface，为路由 meta 扩展 `vue-router` 类型
13. **`<style scoped>` 穿透子组件**：使用 `:deep(.el-table .cell) { ... }` 覆盖组件库内部样式
14. **响应式布局**：侧边栏折叠使用 CSS transition，内容区自适应用 Flex
15. **`el-pagination` 的 `@change` 事件参数**：是 `(page, pageSize)`，不是 `(page)`

---

## 十二、验证 checklist

完成所有页面转换后，结合蓝图文件逐条验证：

### 布局结构
- [ ] 侧边栏正确渲染，菜单项与蓝图一致
- [ ] 折叠/展开切换正常，过渡动画流畅
- [ ] 顶栏包含蓝图指定的元素
- [ ] 面包屑路径与当前路由一致
- [ ] 内容区 `<router-view>` 正确渲染匹配的页面

### 路由
- [ ] 所有页面在 `router/index.ts` 中注册
- [ ] 嵌套路由正确（父路由 `children` + 父组件 `<router-view>`）
- [ ] 页面跳转正常（`router.push`、`<router-link>`）
- [ ] 路由参数传递正确（`route.params.id`）
- [ ] 路由守卫框架已创建（占位逻辑）

### 视觉还原
- [ ] CSS Variables 定义完整，与蓝图 Token 表一致
- [ ] Element Plus 主题变量覆盖完成
- [ ] 色板/字号/间距/圆角/阴影与蓝图一致
- [ ] 各页面与原型视觉对比一致

### 组件映射
- [ ] 蓝图中的每个原型 UI 片段已映射到 Element Plus 组件
- [ ] 表格、表单、弹窗、菜单等核心组件替换正确
- [ ] 组件库默认样式通过 CSS Variables 统一调整

### 图表（如有）
- [ ] ECharts 正确初始化
- [ ] 图表类型与蓝图清单一致
- [ ] Option 配置与 Mock 数据对应
- [ ] 图表响应式 resize 正常

### 交互
- [ ] 表格排序、筛选、分页正常工作（Mock 数据驱动）
- [ ] 表单校验规则正确，提交按钮 Loading 状态正常
- [ ] 弹窗/抽屉显隐逻辑正确
- [ ] 业务逻辑部分已用 `ElMessage.info('功能开发中')` 占位
- [ ] 事件绑定正确（`@click`、`@change`、`v-model`）

### Mock 数据
- [ ] `utils/mock.ts` 包含蓝图所有页面的数据
- [ ] 所有数据源有 TypeScript Interface 定义
- [ ] 各页面数据引用和渲染正确
- [ ] 分页 Mock 逻辑（模拟 total / page / pageSize）

### 代码质量
- [ ] TypeScript 编译无错误（`vue-tsc --noEmit`）
- [ ] Vite Build 成功（`npm run build`）
- [ ] ESLint 无报错（如已配置）
- [ ] 所有组件使用 `<script setup lang="ts">`
- [ ] 无 `any` 类型（Mock 数据有明确定义）

### 响应式
- [ ] 侧边栏折叠/展开布局过渡正常
- [ ] 1920×1080 分辨率布局正确
- [ ] 1366×768 分辨率布局正确
- [ ] 图表在容器尺寸变化时自动 resize
