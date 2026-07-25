# React + Ant Design 参考

将 HTML 原型转换为 React（Ant Design）管理后台时使用本参考。

---

## 文件结构

### 标准项目骨架

```
project/
├── src/
│   ├── layouts/
│   │   └── DefaultLayout.tsx         # 侧边栏+顶栏+内容区+面包屑
│   ├── pages/                        # 业务页面（按路由分组）
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   └── system/
│   │       └── user/
│   │           ├── index.tsx          # 用户列表
│   │           └── detail.tsx         # 用户详情
│   ├── components/                   # 公共组件
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MultiTabs.tsx
│   │   └── ChartCard.tsx             # 图表卡片容器
│   ├── stores/                       # Zustand stores
│   │   ├── useAppStore.ts            # 侧边栏折叠、多标签页、面包屑
│   │   └── useUserStore.ts           # 用户信息（占位）
│   ├── router/
│   │   └── index.tsx
│   ├── utils/
│   │   ├── mock.ts                   # 所有 Mock 数据集中管理
│   │   └── echarts.ts               # ECharts 封装（按需引入）
│   ├── styles/
│   │   ├── variables.css             # 设计 Token (CSS Variables)
│   │   └── global.css                # 全局样式 + reset
│   ├── App.tsx
│   └── main.tsx
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
npm create vite@latest project -- --template react-ts
cd project
```

### 1.2 依赖安装

```bash
# 核心依赖
npm install react-router-dom antd @ant-design/icons zustand

# ECharts（如有图表）
npm install echarts echarts-for-react

# 开发依赖
npm install -D @types/node
```

### 1.3 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

### 1.4 main.tsx 入口

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/variables.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN} theme={{ /* 主题配置见下文 */ }}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

---

## 二、设计 Token 注入

### 2.1 CSS Variables 定义

```css
/* src/styles/variables.css */
:root {
  /* ===== 主色 ===== */
  --color-primary: #1677ff;
  --color-primary-hover: #4096ff;
  --color-primary-active: #0958d9;

  /* ===== 功能色 ===== */
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-danger: #ff4d4f;
  --color-info: #1677ff;

  /* ===== 中性色 ===== */
  --color-text-primary: rgba(0, 0, 0, 0.88);
  --color-text-secondary: rgba(0, 0, 0, 0.65);
  --color-text-tertiary: rgba(0, 0, 0, 0.45);
  --color-text-quaternary: rgba(0, 0, 0, 0.25);
  --color-border: #d9d9d9;
  --color-border-secondary: #f0f0f0;
  --color-bg-layout: #f5f5f5;
  --color-bg-container: #ffffff;

  /* ===== 字号 ===== */
  --font-size-h1: 38px;
  --font-size-h2: 30px;
  --font-size-h3: 24px;
  --font-size-h4: 20px;
  --font-size-h5: 16px;
  --font-size-body: 14px;
  --font-size-small: 12px;

  /* ===== 间距 ===== */
  --spacing-page: 24px;
  --spacing-card: 24px;
  --spacing-section: 16px;
  --spacing-comp: 12px;
  --spacing-inline: 8px;

  /* ===== 圆角 ===== */
  --radius-card: 8px;
  --radius-button: 6px;
  --radius-input: 6px;
  --radius-dialog: 8px;

  /* ===== 阴影 ===== */
  --shadow-card: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
  --shadow-dialog: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);

  /* ===== 布局 ===== */
  --sidebar-width: 220px;
  --sidebar-collapsed-width: 80px;
  --header-height: 56px;
}
```

### 2.2 Ant Design ConfigProvider 主题覆盖

```tsx
// src/main.tsx 或 src/App.tsx
import { ConfigProvider, theme } from 'antd'

const appTheme = {
  token: {
    colorPrimary: '#1677ff',               // var(--color-primary)
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorTextBase: 'rgba(0, 0, 0, 0.88)',
    colorBgBase: '#ffffff',
    borderRadius: 6,                        // var(--radius-button)
    fontSize: 14,                           // var(--font-size-body)
    wireframe: false,
  },
  components: {
    Layout: {
      bodyBg: '#f5f5f5',                   // var(--color-bg-layout)
      headerBg: '#ffffff',
      siderBg: '#001529',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemSelectedColor: '#ffffff',
    },
  },
}

function App() {
  return (
    <ConfigProvider theme={appTheme}>
      {/* routes */}
    </ConfigProvider>
  )
}
```

> [!TIP]
> Ant Design 5.x 使用 CSS-in-JS（cssinjs）方案。`ConfigProvider` 的 `theme.token` 覆盖全局 Token，`theme.components` 覆盖组件级 Token。Token 表查阅 [Ant Design 文档 - Design Token](https://ant.design/docs/react/customize-theme-cn)。

---

## 三、布局框架

### 3.1 DefaultLayout.tsx（标准管理后台布局）

```tsx
// src/layouts/DefaultLayout.tsx
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Layout, Breadcrumb } from 'antd'
import { useAppStore } from '@/stores/useAppStore'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import MultiTabs from '@/components/MultiTabs'

const { Content, Footer } = Layout

export default function DefaultLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { showTabs, showFooter, footerText } = useAppStore()

  // 生成面包屑
  const breadcrumbItems = location.pathname
    .split('/')
    .filter(Boolean)
    .map((item, index, arr) => ({
      title: item,
      path: '/' + arr.slice(0, index + 1).join('/'),
    }))

  // 格式化面包屑标题（可扩展为路由 meta 映射）
  const breadcrumbTitleMap: Record<string, string> = {
    dashboard: '仪表盘',
    system: '系统管理',
    user: '用户管理',
    role: '角色管理',
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sidebar collapsed={collapsed} />

      <Layout>
        {/* 顶栏 */}
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        {/* 多标签页 */}
        {showTabs && <MultiTabs />}

        {/* 面包屑 */}
        <div style={{ padding: '12px 24px', background: '#fff' }}>
          <Breadcrumb
            items={[
              { title: '首页', path: '/dashboard' },
              ...breadcrumbItems.map(item => ({
                title: breadcrumbTitleMap[item.title] || item.title,
                path: item.path,
              })),
            ].map(item => ({
              title: item.path ? <a href={`/#${item.path}`}>{item.title}</a> : item.title,
            }))}
          />
        </div>

        {/* 内容区 */}
        <Content style={{ padding: 24, background: 'var(--color-bg-layout)', overflow: 'auto' }}>
          <Outlet />
        </Content>

        {/* 页脚 */}
        {showFooter && (
          <Footer style={{ textAlign: 'center', padding: '16px 50px', color: 'var(--color-text-tertiary)' }}>
            {footerText}
          </Footer>
        )}
      </Layout>
    </Layout>
  )
}
```

### 3.2 Sidebar.tsx（侧边栏组件）

```tsx
// src/components/Sidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
}

// 菜单项（从蓝图路由树生成）
const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/system/user', label: '用户管理' },
      { key: '/system/role', label: '角色管理' },
    ],
  },
]

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // 计算当前选中的菜单项
  const selectedKeys = [location.pathname]
  const openKeys = menuItems
    .filter(item => 'children' in item && item.children?.some((child: any) => location.pathname.startsWith(child.key)))
    .map(item => item.key as string)

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={220}
      collapsedWidth={80}
      style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}
    >
      {/* Logo */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}>
        {!collapsed ? (
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>
            管理后台
          </span>
        ) : (
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>A</span>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={openKeys}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}
```

### 3.3 Header.tsx（顶栏组件）

```tsx
// src/components/Header.tsx
import { Layout, Button, Avatar, Dropdown, Space } from 'antd'
import type { MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons'

const { Header: AntHeader } = Layout

interface HeaderProps {
  collapsed: boolean
  onToggle: () => void
}

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', label: '个人中心' },
  { key: 'logout', label: '退出登录' },
]

export default function Header({ collapsed, onToggle }: HeaderProps) {
  return (
    <AntHeader style={{
      background: '#fff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--color-border-secondary)',
    }}>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        style={{ fontSize: 16, width: 48, height: 48 }}
      />

      <Space size="middle">
        <Button type="text" icon={<SearchOutlined />} />
        <Button type="text" icon={<BellOutlined />} />

        <Dropdown menu={{ items: userMenuItems }}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size={32} icon={<UserOutlined />} />
            <span>管理员</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}
```

### 3.4 自定义布局注意事项

- Ant Design `Layout` 组件内置 `Sider`、`Header`、`Content`、`Footer` 子组件，天然支持管理后台布局
- `Sider` 的 `collapsible` + `trigger` 或自定义折叠按钮均可
- 侧边栏非必须时可移除整个 `<Sider>`，改用顶栏菜单模式
- 多标签页需配合 Zustand 存储已打开标签

---

## 四、路由配置

### 4.1 router/index.tsx

```tsx
// src/router/index.tsx
import { lazy, Suspense } from 'react'
import { createHashRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

// 懒加载包装
function lazyLoad(importFn: () => Promise<any>) {
  const Component = lazy(importFn)
  return (
    <Suspense fallback={<Spin style={{ display: 'block', margin: '200px auto' }} />}>
      <Component />
    </Suspense>
  )
}

// 路由配置（不含 Header/Sidebar 的页面放在 DefaultLayout 外）
const router = createHashRouter([
  {
    path: '/',
    lazy: () => import('@/layouts/DefaultLayout'),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: lazyLoad(() => import('@/pages/dashboard/index')),
      },
      {
        path: 'system',
        children: [
          { index: true, element: <Navigate to="/system/user" replace /> },
          {
            path: 'user',
            element: lazyLoad(() => import('@/pages/system/user/index')),
          },
          {
            path: 'user/:id',
            element: lazyLoad(() => import('@/pages/system/user/detail')),
          },
          {
            path: 'role',
            element: lazyLoad(() => import('@/pages/system/role/index')),
          },
        ],
      },
    ],
  },
  { path: '/login', element: lazyLoad(() => import('@/pages/login/index')) },
  { path: '*', element: <div>404 Not Found</div> },
])

export default router
```

> [!CAUTION]
> DefaultLayout 需要导出为一个有 `Component` 属性的对象或使用 `lazy()` 包装。如果直接导出组件，需改为 `element: <DefaultLayout />` 方式。

### 4.2 页面跳转方法

```tsx
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { message } from 'antd'

function UserList() {
  const navigate = useNavigate()

  // 普通跳转
  function goDetail(id: number) {
    navigate(`/system/user/${id}`)
  }

  // 带查询参数跳转
  function goWithQuery() {
    navigate('/system/user?status=active')
  }

  // 未实现功能占位
  function notImplemented() {
    message.info('功能开发中')
  }

  return (
    <>
      {/* 声明式跳转 */}
      <Link to="/system/role">角色管理</Link>
    </>
  )
}
```

---

## 五、状态管理（Zustand）

### 5.1 useAppStore（全局应用状态）

```typescript
// src/stores/useAppStore.ts
import { create } from 'zustand'

interface TabItem {
  path: string
  title: string
}

interface AppState {
  sidebarCollapsed: boolean
  showTabs: boolean
  showFooter: boolean
  footerText: string
  openedTabs: TabItem[]
  activeTab: string

  toggleSidebar: () => void
  addTab: (tab: TabItem) => void
  removeTab: (path: string) => void
  setActiveTab: (path: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  showTabs: false,
  showFooter: false,
  footerText: '© 2024 Company Name',
  openedTabs: [],
  activeTab: '',

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  addTab: (tab) => set(state => {
    const exists = state.openedTabs.find(t => t.path === tab.path)
    if (exists) return { activeTab: tab.path }
    return {
      openedTabs: [...state.openedTabs, tab],
      activeTab: tab.path,
    }
  }),

  removeTab: (path) => set(state => ({
    openedTabs: state.openedTabs.filter(t => t.path !== path),
  })),

  setActiveTab: (path) => set({ activeTab: path }),
}))
```

### 5.2 useUserStore（用户信息占位）

```typescript
// src/stores/useUserStore.ts
import { create } from 'zustand'

interface UserInfo {
  id: number
  name: string
  avatar: string
  roles: string[]
  permissions: string[]
}

interface UserState {
  token: string | null
  userInfo: UserInfo | null
  isLoggedIn: () => boolean
  hasPermission: (perm: string) => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  token: 'mock-token',
  userInfo: {
    id: 1,
    name: '管理员',
    avatar: '',
    roles: ['admin'],
    permissions: ['*'],
  },

  isLoggedIn: () => !!get().token,

  hasPermission: (perm) => {
    const { userInfo } = get()
    if (!userInfo) return false
    if (userInfo.permissions.includes('*')) return true
    return userInfo.permissions.includes(perm)
  },
}))
```

---

## 六、组件映射

### 6.1 完整映射表

| HTML 原型 | Ant Design | 说明 |
|-----------|-----------|------|
| `<div>` `<section>` `<main>` `<article>` | `<div>` 保留 | Web 端不限标签 |
| `<header>` | `<Layout.Header>` 或 `<div>` | Layout 内用内置组件 |
| `<aside>` `<nav>` | `<Menu>` 或 `<div>` | 侧边栏导航 |
| `<table>` `<thead>` `<tbody>` `<tr>` `<td>` `<th>` | `<Table>` + `columns` 配置 | 数据表格 |
| `<form>` | `<Form>` | 表单容器 |
| `<input type="text">` | `<Input>` | 文本输入 |
| `<input type="number">` | `<InputNumber>` | 数字输入 |
| `<input type="password">` | `<Input.Password>` | 密码输入 |
| `<textarea>` | `<Input.TextArea>` | 文本域 |
| `<select>` | `<Select>` + `<Select.Option>` | 下拉选择 |
| `<input type="radio">` | `<Radio.Group>` + `<Radio>` | 单选组 |
| `<input type="checkbox">` | `<Checkbox.Group>` + `<Checkbox>` | 多选组 |
| `<button>` | `<Button>` | 按钮（含 loading 状态） |
| `<button type="submit">` | `<Button type="primary" htmlType="submit">` | 提交按钮 |
| `<img>` | `<img>` 或 `<Image>` | 后者支持预览 |
| `<a href="...">` | `<Link>` 或 `navigate()` | 路由跳转 |
| `<a href="javascript:;">` | `<Button type="link">` 或 `<span onClick>` | 无跳转链接 |
| `<svg>` (图标) | `@ant-design/icons` 组件 | |
| `<dialog>` `<div class="modal">` | `<Modal>` | 弹窗 |
| 下拉菜单 | `<Dropdown>` + `items` 配置 | |
| 分页控件 | `<Pagination>` | |
| Tabs 切换 | `<Tabs>` + `<Tabs.TabPane>` | |
| 步骤条 | `<Steps>` + `<Steps.Step>` | |
| 侧边抽屉 | `<Drawer>` | |
| 树形控件 | `<Tree>` | |
| 文件上传 | `<Upload>` | |
| 开关 | `<Switch>` | |
| 滑块 | `<Slider>` | |
| 日期选择 | `<DatePicker>` | |
| 时间选择 | `<TimePicker>` | |
| 级联选择 | `<Cascader>` | |
| 穿梭框 | `<Transfer>` | |
| 进度条 | `<Progress>` | |
| 标签/徽标 | `<Tag>` | |
| 头像 | `<Avatar>` | |
| 骨架屏 | `<Skeleton>` | |
| 空状态 | `<Empty>` | |
| 描述列表 | `<Descriptions>` + `<Descriptions.Item>` | |
| 统计数值 | `<Statistic>` | Ant Design 内置 |
| 时间线 | `<Timeline>` + `<Timeline.Item>` | |
| 折叠面板 | `<Collapse>` + `<Collapse.Panel>` | |
| 卡片容器 | `<Card>` | |
| 走马灯/轮播 | `<Carousel>` | |
| 确认弹窗 | `Modal.confirm()` | JS 调用 |
| 消息提示 | `message.success()` / `.warning()` / `.error()` | JS 调用 |
| 通知 | `notification.open()` | JS 调用 |
| 评分 | `<Rate>` | |
| 徽标/红点 | `<Badge>` | |
| 文字提示 | `<Tooltip>` | |
| 气泡卡片 | `<Popover>` | |
| 水印 | `<Watermark>` | Ant Design 5.x |
| 加载中 | `<Spin>` | |
| 回到顶部 | `<BackTop>` | Ant Design 内置 |
| 分割线 | `<Divider>` | |
| 水印 | `<Watermark>` | Ant Design 5.x |
| 全局尺寸 | `<ConfigProvider componentSize="middle">` | |
| 弹窗表单 | `<Modal>` > `<Form>` | 嵌套 |

### 6.2 表格映射详解

```tsx
// src/pages/system/user/index.tsx
import { useState, useEffect } from 'react'
import {
  Card, Form, Input, Select, Button, Table, Tag,
  Space, Popconfirm, Modal, message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { userListData, type User } from '@/utils/mock'

export default function UserList() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form] = Form.useForm()

  // 分页
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    fetchData()
  }, [])

  function fetchData() {
    setLoading(true)
    setTimeout(() => {
      setData(userListData)
      setPagination(prev => ({ ...prev, total: userListData.length }))
      setLoading(false)
    }, 300)
  }

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 80, sorter: true },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', width: 180, sorter: true },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" onClick={() => message.info('功能开发中')}>查看</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  function handleEdit(record: User) {
    form.setFieldsValue(record)
    setDialogOpen(true)
  }

  function handleDelete(id: number) {
    message.success('删除成功')
    setData(prev => prev.filter(item => item.id !== id))
  }

  return (
    <Card>
      {/* 搜索表单 */}
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="用户名">
          <Input placeholder="请输入" allowClear />
        </Form.Item>
        <Form.Item label="状态">
          <Select placeholder="请选择" allowClear style={{ width: 120 }}>
            <Select.Option value="active">启用</Select.Option>
            <Select.Option value="inactive">禁用</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">搜索</Button>
          <Button style={{ marginLeft: 8 }}>重置</Button>
        </Form.Item>
      </Form>

      {/* 操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialogOpen(true)}>
            新增
          </Button>
          <Button danger icon={<DeleteOutlined />} disabled={!selectedRowKeys.length}>
            批量删除
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Table<User>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
        }}
        scroll={{ x: 1000 }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title="用户信息"
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        onOk={() => { form.validateFields().then(() => setDialogOpen(false)) }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
```

### 6.3 描述列表映射

```tsx
<Descriptions bordered column={2}>
  <Descriptions.Item label="用户名">张三</Descriptions.Item>
  <Descriptions.Item label="手机号">138****8888</Descriptions.Item>
  <Descriptions.Item label="邮箱">zhangsan@example.com</Descriptions.Item>
  <Descriptions.Item label="状态">
    <Tag color="success">启用</Tag>
  </Descriptions.Item>
  <Descriptions.Item label="备注" span={2}>
    这是一段备注信息
  </Descriptions.Item>
</Descriptions>
```

### 6.4 统计卡片映射

```tsx
<Row gutter={16}>
  {statsData.map(item => (
    <Col span={6} key={item.title}>
      <Card>
        <Statistic
          title={item.title}
          value={item.value}
          prefix={<item.icon />}
          valueStyle={{ color: item.color }}
        />
      </Card>
    </Col>
  ))}
</Row>
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

### 7.2 图表组件（echarts-for-react）

```tsx
// src/components/ChartCard.tsx
import ReactECharts from 'echarts-for-react'
import { Card } from 'antd'
import type { EChartsOption } from 'echarts'

interface ChartCardProps {
  title: string
  option: EChartsOption
  height?: number
}

export default function ChartCard({ title, option, height = 400 }: ChartCardProps) {
  return (
    <Card title={title} bodyStyle={{ padding: 20 }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height }}
        notMerge
        lazyUpdate
      />
    </Card>
  )
}
```

### 7.3 常用图表 Option 模板

```typescript
import type { EChartsOption } from 'echarts'

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
  series: [{ type: 'line', data: [820, 932, 901, 934, 1290], smooth: true }],
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
    { title: '总用户数', value: '12,846', color: '#1677ff' },
    { title: '总订单数', value: '8,234', color: '#52c41a' },
    { title: '销售额', value: '¥128,460', color: '#faad14' },
    { title: '转化率', value: '24.6%', color: '#ff4d4f' },
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

---

## 九、图标方案

> [!IMPORTANT]
> 管理后台推荐使用组件库自带图标组件（风格统一、树摇优化）。需要补充图标时使用 **[Lucide](https://lucide.dev/)** — shadcn/ui 默认图标库，1000+ 极简线条风格图标。

### @ant-design/icons（推荐）

```tsx
import {
  HomeOutlined, SearchOutlined, SettingOutlined, UserOutlined,
  EditOutlined, DeleteOutlined, PlusOutlined, DownloadOutlined,
  ReloadOutlined, BellOutlined, CheckOutlined, WarningOutlined,
  ExclamationCircleOutlined, UploadOutlined, FileOutlined,
  CalendarOutlined, EnvironmentOutlined, DashboardOutlined,
  MoneyCollectOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined,
  CopyOutlined, LinkOutlined, MessageOutlined,
} from '@ant-design/icons'

<HomeOutlined style={{ fontSize: 18 }} />
<SearchOutlined />
<SettingOutlined />
```

### Lucide React（补充方案）

当 @ant-design/icons 缺少所需图标时，使用 `lucide-react`：

```bash
npm install lucide-react
```

```tsx
import { BarChart3, MapPin } from 'lucide-react'

<BarChart3 size={18} color="#94a3b8" />
<MapPin size={18} color="#94a3b8" />
```

**常用图标映射参考：**

| 用途 | Ant Design Icon | Lucide 替代（无组件库时） |
|------|----------------|------------------------|
| 首页/Dashboard | `DashboardOutlined` | `house` |
| 用户 | `UserOutlined` | `user-round` |
| 角色/权限 | `SafetyOutlined` | `shield` |
| 设置 | `SettingOutlined` | `settings` |
| 搜索 | `SearchOutlined` | `search` |
| 编辑 | `EditOutlined` | `pencil` |
| 删除 | `DeleteOutlined` | `trash-2` |
| 新增 | `PlusOutlined` | `plus` |
| 导出 | `DownloadOutlined` | `download` |
| 刷新 | `ReloadOutlined` | `refresh-cw` |
| 菜单折叠 | `MenuFoldOutlined` / `MenuUnfoldOutlined` | `panel-left-close` / `panel-left-open` |
| 通知 | `BellOutlined` | `bell` |
| 全屏 | `FullscreenOutlined` | `maximize` |
| 关闭 | `CloseOutlined` | `x` |
| 确认 | `CheckOutlined` | `check` |
| 警告 | `WarningOutlined` | `triangle-alert` |
| 信息 | `ExclamationCircleOutlined` | `info` |
| 上传 | `UploadOutlined` | `upload` |
| 图片 | `PictureOutlined` | `image` |
| 文件 | `FileOutlined` | `file-text` |
| 日历 | `CalendarOutlined` | `calendar` |
| 位置 | `EnvironmentOutlined` | `map-pin` |
| 数据/图表 | `BarChartOutlined` | `bar-chart-3` |
| 金额 | `MoneyCollectOutlined` | `dollar-sign` |
| 锁定 | `LockOutlined` | `lock` |
| 可见 | `EyeOutlined` | `eye` |
| 不可见 | `EyeInvisibleOutlined` | `eye-off` |
| 复制 | `CopyOutlined` | `copy` |
| 链接 | `LinkOutlined` | `link` |
| 消息 | `MessageOutlined` | `message-circle` |

---

## 十、事件映射

| Web 原型事件 | React 写法 | 说明 |
|-------------|-----------|------|
| `onclick` / `@click` | `onClick={handler}` | 点击 |
| `onchange` (input) | `onChange={e => ...}` / 受控组件 `value+onChange` | 输入变化 |
| `onchange` (select/checkbox) | `onChange={value => ...}` | 值变化 |
| `onsubmit` | `onFinish={handler}` (Ant Design) / `onSubmit` | 表单提交 |
| `onfocus` | `onFocus` | 获取焦点 |
| `onblur` | `onBlur` | 失去焦点 |
| `onmouseenter` | `onMouseEnter` | 鼠标进入 |
| `onmouseleave` | `onMouseLeave` | 鼠标离开 |
| `onkeydown` / `onkeyup` | `onKeyDown` / `onKeyUp` | 键盘事件 |
| `onscroll` | `onScroll` | 滚动事件 |

---

## 十一、常见陷阱

1. **Ant Design Form 数据管理**：5.x 推荐用 `Form.useForm()` + `onFinish`，不用手动维护每个字段的 state
2. **Table columns 的 `render` 返回值类型**：必须是 `React.ReactNode`，不能返回 `void`
3. **Modal `open` vs `visible`**：Ant Design 5.x 用 `open`，4.x 用 `visible`
4. **Dropdown `overlay` vs `menu`**：5.x 用 `menu={{ items: [...] }}`，旧版用 `overlay={<Menu items={...} />}`
5. **ConfigProvider 的 `theme` 配置**：5.x 使用 `token` + `components` 结构，与 4.x 完全不同
6. **`Table` 的 `rowSelection`**：`onChange` 返回 `React.Key[]`，不是完整对象
7. **Pagination 的 `onChange` 参数**：Ant Design 是 `(page, pageSize)`，注意顺序
8. **Zustand `set` 的合并行为**：默认替换整个 state 对象（与 Redux 不同），需用 `set(state => ({ ...state, key: value }))` 部分更新
9. **React Router 6 `Navigate` vs `Redirect`**：v6 移除了 `Redirect`，用 `<Navigate to="..." replace />`
10. **CSS Variables 作用域**：在 `:root` 中定义，在 CSS Modules 中通过 `var()` 引用
11. **Vite 路径别名**：配置 `@` 指向 `src/`，同步更新 `tsconfig.json` 的 `paths`
12. **`echarts-for-react` 的 `notMerge`**：设为 `true` 避免 option 合并导致的残留配置
13. **Table column `fixed: 'right'`**：需要同时设 `scroll={{ x: ... }}` 才能生效
14. **Ant Design Icons 是具名导出**：按需导入，不要全量引入
15. **`<Spin>` 不能作为 `<Suspense>` fallback 的唯一子元素**：需包裹在 `<div>` 中或设 `style={{ display: 'block', margin: '200px auto' }}`

---

## 十二、验证 checklist

完成所有页面转换后，结合蓝图文件逐条验证：

### 布局结构
- [ ] 侧边栏正确渲染，菜单项与蓝图一致
- [ ] 折叠/展开切换正常，过渡动画流畅
- [ ] 顶栏包含蓝图指定的元素
- [ ] 面包屑路径与当前路由一致
- [ ] 内容区 `<Outlet />` 正确渲染匹配的页面

### 路由
- [ ] 所有页面在 router 中注册
- [ ] 嵌套路由正确（父路由 `children` + 父组件 `<Outlet />`）
- [ ] 页面跳转正常（`navigate()`、`<Link>`）
- [ ] 路由参数传递正确（`useParams()`）
- [ ] 路由守卫占位已创建

### 视觉还原
- [ ] CSS Variables 定义完整，与蓝图 Token 表一致
- [ ] Ant Design ConfigProvider 主题覆盖完成
- [ ] 色板/字号/间距/圆角/阴影与蓝图一致
- [ ] 各页面与原型视觉对比一致

### 组件映射
- [ ] 蓝图中的每个原型 UI 片段已映射到 Ant Design 组件
- [ ] 表格、表单、弹窗、菜单等核心组件替换正确
- [ ] 组件库默认样式通过 `ConfigProvider` 或 CSS Variables 统一调整

### 图表（如有）
- [ ] ECharts 正确初始化
- [ ] 图表类型与蓝图清单一致
- [ ] Option 配置与 Mock 数据对应
- [ ] 图表响应式 resize 正常

### 交互
- [ ] 表格排序、筛选、分页正常工作（Mock 数据驱动）
- [ ] 表单校验规则正确，提交按钮 Loading 状态正常
- [ ] 弹窗/抽屉显隐逻辑正确
- [ ] 业务逻辑部分已用 `message.info('功能开发中')` 占位
- [ ] 事件绑定正确（`onClick`、`onChange`、受控组件）

### Mock 数据
- [ ] `utils/mock.ts` 包含蓝图所有页面的数据
- [ ] 所有数据源有 TypeScript Interface 定义
- [ ] 各页面数据引用和渲染正确
- [ ] 分页 Mock 逻辑（模拟 total / page / pageSize）

### 代码质量
- [ ] TypeScript 编译无错误（`tsc --noEmit`）
- [ ] Vite Build 成功（`npm run build`）
- [ ] ESLint 无报错（如已配置）
- [ ] 所有组件使用函数组件 + Hooks
- [ ] 无 `any` 类型（Mock 数据有明确定义）

### 响应式
- [ ] 侧边栏折叠/展开布局过渡正常
- [ ] 1920×1080 分辨率布局正确
- [ ] 1366×768 分辨率布局正确
- [ ] 图表在容器尺寸变化时自动 resize
