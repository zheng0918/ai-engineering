# project-structure — 前端项目结构强约束

> 本文件规定 Vue 3 / React 前端项目的目录结构、技术栈与命名约束。

---

## 1. 技术栈约束

### 1.1 框架选型

| 框架 | 状态管理 | UI 组件库 | 构建工具 | 路由 |
|---|---|---|---|---|
| **Vue 3**（默认） | Pinia | Element Plus | Vite 5+ | Vue Router 4 |
| React 18（备选） | Zustand | Ant Design | Vite 5+ | React Router 6 |

### 1.2 必须使用

- **TypeScript**（严格模式）
- **SCSS**（样式预处理）
- **Vite**（构建工具）
- **pnpm**（包管理器，禁止 npm/yarn）
- **ESLint + Prettier**（代码规范）

### 1.3 禁止使用

- Vue 2 / Options API（必须 Composition API `<script setup>`）
- React Class 组件
- JQuery / 老旧 DOM 库
- CSS inline style
- `var` 声明变量
- `any` 类型（除非极特殊情况并注释说明）

---

## 2. 标准包结构（Vue 3）

```
src/
├── api/                    # 接口请求
│   ├── request.ts          # Axios 拦截器封装
│   ├── modules/            # 按业务模块拆分
│   │   ├── user.ts
│   │   └── goods.ts
│   └── types/              # 接口类型定义
├── assets/                 # 静态资源
│   ├── images/
│   └── icons/
├── components/             # 公共组件
│   ├── base/               # 基础组件（Button/Modal/Table 二次封装）
│   └── biz/                # 业务组件
├── composables/            # 组合式函数（hooks）
│   ├── useAuth.ts
│   ├── useTable.ts
│   └── usePagination.ts
├── config/                 # 配置
│   ├── index.ts            # 应用常量
│   └── env.ts              # 环境变量
├── layouts/                # 布局组件
│   ├── DefaultLayout.vue
│   └── BlankLayout.vue
├── pages/                  # 页面（按业务模块分组）
│   └── {module}/
│       ├── list.vue
│       ├── detail.vue
│       └── components/     # 页面私有组件
├── router/                 # 路由配置
│   ├── index.ts
│   └── modules/            # 按模块拆分路由
├── store/                  # Pinia 状态管理
│   ├── user.ts
│   ├── app.ts
│   └── permission.ts
├── styles/                 # 全局样式
│   ├── variables.scss      # SCSS 变量
│   ├── mixins.scss         # SCSS mixin
│   ├── reset.scss          # 样式重置
│   └── global.scss         # 全局样式
├── utils/                  # 工具函数
│   ├── index.ts
│   ├── storage.ts
│   └── validator.ts
├── App.vue
├── main.ts
└── env.d.ts                # 环境变量类型声明
```

### 环境变量文件

```
.env                    # 公共变量
.env.development        # 开发环境
.env.production         # 生产环境
```

---

## 3. 命名规范

| 类型 | 命名 | 示例 |
|---|---|---|
| 页面文件 | kebab-case | `user-list.vue`、`goods-detail.vue` |
| 组件文件 | PascalCase | `BaseTable.vue`、`GoodsCard.vue` |
| 组件目录 | PascalCase | `components/base/BaseTable/` |
| 布局组件 | PascalCase + Layout 后缀 | `DefaultLayout.vue` |
| 路由模块 | kebab-case | `router/modules/user.ts` |
| Store | camelCase | `store/user.ts` |
| API 模块 | camelCase | `api/modules/user.ts` |
| Hooks | use + PascalCase | `useAuth.ts`、`useTable.ts` |
| 工具函数 | camelCase | `storage.ts`、`validator.ts` |
| SCSS 文件 | kebab-case | `variables.scss` |
| CSS 类名 | BEM（kebab-case） | `goods-card`、`goods-card__title` |
| TypeScript 类型 | PascalCase | `UserVO`、`GoodsQuery` |

---

## 4. 禁止事项

- ❌ Options API / Class 组件
- ❌ `any` 类型泛滥
- ❌ inline style
- ❌ 硬编码颜色/字号/间距
- ❌ API URL 硬编码在业务代码中
- ❌ 组件目录无 `index.vue` 入口
- ❌ `pnpm-lock.yaml` 不提交（必须提交）
