# project-structure — 小程序项目结构强约束

> 本文件规定小程序项目的目录结构、技术栈与命名约束。与本文件冲突的产物视为不合规。

---

## 1. 技术栈约束

### 1.1 框架选型（二选一）

| 框架 | 语法 | UI 组件库 | 状态管理 |
|---|---|---|---|
| **uniapp**（推荐） | Vue 3 + Composition API | uView Plus / uni-ui | Pinia |
| **taro** | React 18 / Vue 3 | NutUI / Taro UI | Zustand / Pinia |

### 1.2 必须使用

- **uniapp CLI** 或 **Taro CLI**（非 HBuilderX 图形化）
- **Vue 3 Composition API** / **React Hooks**（禁止 Options API / Class 组件）
- **Pinia**（uniapp）或 **Zustand**（taro）状态管理
- **TypeScript**（类型安全）
- **SCSS**（样式预处理）
- **uView Plus**（uniapp）或 **NutUI**（taro）UI 组件库

### 1.3 禁止使用

- HBuilderX 图形化操作（必须用 CLI）
- Vue 2 Options API
- 原生 `wx.request` / `uni.request` 裸调用（必须封装）
- `var` 声明变量（必须 `const` / `let`）
- CSS 硬编码颜色值（必须用 SCSS 变量）

---

## 2. 标准包结构

### 2.1 uniapp 结构

```
src/
├── pages/                  # 页面（uniapp 自动路由）
│   └── {module}/           # 按业务模块分包
│       ├── index.vue
│       └── detail.vue
├── components/             # 公共组件
│   └── {name}/
│       └── index.vue
├── api/                    # 接口请求层
│   ├── request.ts          # 请求拦截器（axios / flyio）
│   └── {module}.ts         # 按业务模块拆分
├── store/                  # Pinia 状态管理
│   ├── user.ts
│   └── app.ts
├── router/                 # 路由守卫（uni.addInterceptor）
│   └── index.ts
├── config/                 # 配置
│   ├── index.ts            # 公共配置
│   └── env.ts              # 环境变量
├── utils/                  # 工具函数
│   ├── index.ts
│   ├── storage.ts          # 本地存储封装
│   └── validator.ts        # 校验工具
├── styles/                 # 全局样式
│   ├── variables.scss      # SCSS 变量（颜色/字号/间距）
│   ├── mixins.scss         # SCSS mixin
│   └── global.scss         # 全局样式
├── static/                 # 静态资源（图片/字体）
├── App.vue                 # 应用入口
├── main.ts                 # 入口 JS
├── pages.json              # uniapp 页面路由配置
├── manifest.json           # 应用配置
└── uni.scss                # uniapp 全局 SCSS 变量
```

### 2.2 taro 结构

```
src/
├── pages/
│   └── {module}/
│       ├── index.tsx
│       └── detail.tsx
├── components/
│   └── {name}/
│       └── index.tsx
├── api/
│   ├── request.ts
│   └── {module}.ts
├── store/
│   └── {module}.ts
├── config/
│   └── index.ts
├── utils/
│   ├── index.ts
│   └── storage.ts
├── styles/
│   ├── variables.scss
│   └── global.scss
├── app.config.ts           # Taro 路由配置
├── app.tsx                 # 应用入口
└── app.scss
```

---

## 3. 命名规范

| 类型 | 命名 | 示例 |
|---|---|---|
| 页面 | 小写 + 连字符 | `product-list/index.vue` |
| 组件 | PascalCase 目录 + index | `GoodsCard/index.vue` |
| API 模块 | 小写驼峰 | `product.ts`、`order.ts` |
| Store 模块 | 小写驼峰 | `user.ts`、`cart.ts` |
| 工具函数 | 小写驼峰 | `storage.ts`、`validator.ts` |
| SCSS 文件 | 小写 + 连字符 | `variables.scss` |
| CSS 类名 | kebab-case | `goods-card__title` |
| TS 类型 | PascalCase | `GoodsInfo`、`OrderDetail` |

---

## 4. 分包策略

```
pages/
├── tab/          # 主包（tabBar 页面）
│   ├── home/
│   ├── category/
│   ├── cart/
│   └── mine/
├── goods/        # 分包 - 商品
├── order/        # 分包 - 订单
├── user/         # 分包 - 用户
└── activity/     # 分包 - 活动
```

---

## 5. 禁止事项

- ❌ pages.json / app.config 手动写路径（应用脚本扫描生成）
- ❌ 页面 inline style（必须用 class）
- ❌ 硬编码颜色值（必须用 SCSS 变量）
- ❌ API 请求未封装拦截器
- ❌ 敏感数据（token/手机号）明文存 Storage
- ❌ 组件目录无 index 入口文件
- ❌ 使用 Options API / Class 组件
