---
name: html-to-admin
description: 将高保真 HTML 原型或前端 Demo 页面转换为 Vue 3（Element Plus）或 React（Ant Design）管理后台项目。一比一还原 UI 视觉、布局框架、路由骨架和简单交互，不涉及后端业务逻辑，数据集中在 mock.js 中管理。
---

# HTML 转管理后台

将任意前端 Demo（HTML/React/Vue 单文件或多文件）或高保真 HTML 原型转换为管理后台项目。用户选择框架（Vue 3 或 React），对应的组件库（Element Plus 或 Ant Design）自动确定。优先保持视觉还原度，再按管理后台的运行模型、布局框架、路由规则与组件库约定改写行为。

> [!IMPORTANT]
> **转换范围**：UI 视觉还原 + 布局框架（侧边栏/顶栏/内容区/面包屑）+ 路由骨架 + 简单交互（页面跳转、弹窗、表格筛选/排序/分页、表单校验、图表渲染），**不实现后端业务逻辑**（如 API 请求、用户认证、数据持久化等）。所有页面数据统一整合在 `utils/mock.ts` 中管理。

> [!IMPORTANT]
> **交互语言**：与用户的所有对话、确认、提问、说明必须使用**中文**。代码中的变量名、文件路径等技术标识符保留英文。

> [!CAUTION]
> **连续执行**：用户确认设计决策（阶段 3）后，阶段 4 ~ 6（生成蓝图、初始化项目基础、逐页转换）必须**一口气连续完成**，中间不得暂停等待用户确认。不要在完成几个页面后就停下来汇报进度或请求继续——**所有页面必须连续完成后再进入验证阶段**。只有在遇到**无法自主决策的问题**时才暂停询问用户。

---

## 框架选择

编辑代码前先询问用户选择目标框架：

- **Vue 3 + Element Plus**：输出 `.vue` 单文件组件（`<script setup lang="ts">`），Vue Router 4 路由，Pinia 状态管理，Element Plus 组件库。详见 `references/element-plus.md`。
- **React + Ant Design**：输出 `.tsx` 函数组件（Hooks），React Router 6 路由，Zustand 状态管理，Ant Design 组件库。详见 `references/ant-design.md`。

如果用户未指定框架，提出一个简短问题确认目标。

---

## 一、转换流程（7 阶段）

### 阶段 1：静态盘点

运行 `scripts/analyze_html.py <html-file-or-dir>` 进行快速自动盘点，输出 JSON 格式的：

- 标签统计（计数器）
- 类名/ID 清单
- 资源文件（图片、字体、脚本、样式表）
- 颜色值（hex、rgb、hsl）
- 字号、字体族
- 布局属性（display、position、flex、grid）
- 单位使用情况（px、rem、em、vh、vw、%）
- 管理系统高风险 CSS（`overflow`、`z-index`、`position: fixed` 等）
- 事件属性（onclick、@click、addEventListener 等）
- 表单控件清单

> [!TIP]
> 对于管理系统场景，脚本额外检测：图表容器（`<canvas>`、ECharts 容器、`<svg>` 图表区）、表格结构（`<table>` 及列头）、导航菜单层级（嵌套 `<ul>` / `<nav>`）、布局区域边界（侧边栏/顶栏/内容区的候选 DOM 节点）。

---

### 阶段 2：多维分析（4 线并行）

基于阶段 1 的盘点结果和源码阅读，同步进行 4 个维度的深度分析：

#### 2a. 布局结构识别

从原型 HTML 中自动检测并划分管理后台布局区域：

| 检测目标 | 识别特征 |
|----------|---------|
| 侧边栏 (Sidebar) | 固定宽度 200-280px、`position: fixed` / `float: left`、包含导航菜单列表、深色背景 |
| 顶栏 (Header) | 固定高度 48-64px、横跨全宽、包含 Logo/用户头像/通知图标/搜索 |
| 内容区 (Content) | 剩余空间、`overflow: auto`、页面主体、`<router-view>` 等价物 |
| 面包屑 (Breadcrumb) | 内容区顶部、`/` 或 `>` 分隔的路径文本 |
| 多标签页 (MultiTabs) | Header 下方的次级 tab 条 |
| 页脚 (Footer) | 底部固定或随内容流，版权信息 |

**输出：** 布局结构图（ASCII 示意）+ 每个区域的 DOM 选择器标注。

#### 2b. 设计 Token 提取

从原型 CSS 中提取设计变量，按类别分组：

- **颜色体系**：主色、辅色、成功色、警告色、危险色、信息色、中性色（文字/背景/边框层级）
- **字号层级**：H1-H6、正文、辅助文字、小字
- **间距体系**：页面 padding、卡片 padding、组件间 gap、表单间距
- **圆角**：按钮圆角、卡片圆角、输入框圆角、弹窗圆角
- **阴影**：卡片阴影、弹窗阴影、下拉菜单阴影

> [!CAUTION]
> Token 提取精度直接影响最终视觉还原度。如果原型使用了 CSS 变量（`var(--xxx)`），必须提取变量定义和引用关系。如果原型使用 Tailwind / UnoCSS，从工具类名反推 Token 值。

**输出：** Token 变量表（CSS Variables 格式，可直接映射到组件库主题变量）。

#### 2c. 组件识别与映射

扫描每个页面，将原型 UI 片段匹配到目标组件库组件：

| 原型 UI 片段 | Element Plus | Ant Design |
|------------|-------------|------------|
| 数据表格 | `<el-table>` | `<Table>` |
| 搜索表单 | `<el-form>` + `<el-input>` | `<Form>` + `<Input>` |
| 弹窗 | `<el-dialog>` | `<Modal>` |
| 下拉菜单 | `<el-dropdown>` | `<Dropdown>` |
| 分页 | `<el-pagination>` | `<Pagination>` |
| 标签页 | `<el-tabs>` | `<Tabs>` |
| 步骤条 | `<el-steps>` | `<Steps>` |
| 抽屉 | `<el-drawer>` | `<Drawer>` |
| 树控件 | `<el-tree>` | `<Tree>` |
| 上传 | `<el-upload>` | `<Upload>` |
| 开关 | `<el-switch>` | `<Switch>` |
| 单选/多选 | `<el-radio-group>` / `<el-checkbox-group>` | `<Radio.Group>` / `<Checkbox.Group>` |
| 日期选择 | `<el-date-picker>` | `<DatePicker>` |
| 下拉选择 | `<el-select>` | `<Select>` |
| 级联选择 | `<el-cascader>` | `<Cascader>` |
| 穿梭框 | `<el-transfer>` | `<Transfer>` |
| 时间线 | `<el-timeline>` | `<Timeline>` |
| 骨架屏 | `<el-skeleton>` | `<Skeleton>` |
| 空状态 | `<el-empty>` | `<Empty>` |
| 统计数值 | `<el-statistic>` | `<Statistic>` |
| 描述列表 | `<el-descriptions>` | `<Descriptions>` |
| 图表（柱状图/折线图/饼图/仪表盘） | ECharts（共用） | ECharts（共用） |

> [!IMPORTANT]
> **图表识别是管理后台特有的分析维度。** 需要单独扫描原型中的图表区域（`<canvas>` 标签、ECharts/Chart.js 等图表库的渲染容器、包含 `chart`/`graph`/`dashboard` 类名的 DOM 节点），识别图表类型（柱状图/折线图/饼图/散点图/仪表盘/雷达图/热力图），在后续转换为 ECharts 配置。

**输出：** 每个页面的组件映射清单 + 图表识别清单 + 需要自定义样式的组件列表。

#### 2d. 路由与数据模型分析

- 从导航菜单（侧边栏/顶栏）推断路由树和嵌套关系
- 从菜单层级推断路由嵌套（如 `系统管理 > 用户管理 → /system/user`）
- 从页面间跳转逻辑（`href`、`onclick` 跳转）推断路由参数
- 从表格列头推断数据字段名和类型
- 从表单字段推断数据结构和校验规则
- 从菜单权限标识推断角色/权限模型

**输出：** 路由树（含嵌套关系）+ 数据模型 TypeScript 接口定义 + Mock 数据结构骨架。

---

### 阶段 3：确认设计决策

多维分析完成后，在生成蓝图之前，**必须与用户确认以下决策**：

> [!CAUTION]
> 以下决策直接影响蓝图内容和后续实现方式，**必须在蓝图创建前完成确认**，避免蓝图与实际执行脱节。

1. **目标框架**：Vue 3 + Element Plus / React + Ant Design（如果阶段 1 前未确认）
2. **布局结构**：展示阶段 2a 识别的布局结构图，确认是否需要调整
3. **页面完整性**：使用固定模板告知发现的页面总数和清单
4. **路由树**：展示路由嵌套关系，确认是否有遗漏
5. **图标方案**：
   - **组件库图标**（推荐）— Element Plus Icons / @ant-design/icons，与组件库风格统一
   - **Lucide 通用图标库** — 当组件库图标无法满足需求时的现代 SVG 替代方案
6. **图表方案**（默认 ECharts）：确认图表类型清单，如有特殊需求在此提出

**页面完整性确认模板（必须原样输出结构）：**

```markdown
已识别页面总数：N（一级路由: X，二级路由: Y，三级路由: Z）
一级路由页面：
- /dashboard — Dashboard 仪表盘
- /system — 系统管理（布局容器）
二级路由页面：
- /system/user — 用户管理
- /system/role — 角色管理
子级路由页面：
- /system/user/:id — 用户详情
疑似遗漏页面（若无则写"无"）：
- ...
```

---

### 阶段 4：生成转换蓝图

根据前 3 个阶段的分析结果和用户确认的设计决策，创建转换蓝图文件 `conversion-blueprint.md`，置于项目根目录。

> [!IMPORTANT]
> 蓝图是整个转换过程的**单一事实来源**，所有后续实现严格对照蓝图执行。

蓝图包含以下内容：

```markdown
# [项目名] 转换蓝图

## 一、布局结构
- 侧边栏：[有/无]，宽度 [N]px，折叠状态，菜单项数量 [N]
- 顶栏：[有/无]，包含元素（面包屑/用户头像/通知/搜索/全屏切换）
- 多标签页：[有/无]
- 页脚：[有/无]

## 二、设计 Token
- 颜色：[详细列表，含 CSS 变量名和值]
- 字号：[H1-H6、正文、辅助文字的具体值]
- 间距：[页面/卡片/组件间的 gap 值]
- 圆角：[按钮/卡片/输入框/弹窗的圆角值]
- 阴影：[卡片/弹窗/下拉菜单的阴影值]

## 三、路由树
- [/dashboard] — Dashboard（图标、权限标识）
  - [/system] — 系统管理（图标、权限标识、布局容器）
    - [/system/user] — 用户管理
    - [/system/role] — 角色管理

## 四、页面清单
| 序号 | 页面名称 | 路由路径 | 路由层级 | 数据源 | 包含图表 |
|------|---------|---------|---------|--------|:--:|
| 1 | Dashboard | /dashboard | 一级 | mock.dashboardData | 是 |
| 2 | 用户列表 | /system/user | 二级 | mock.userListData | - |
| ... | ... | ... | ... | ... | ... |

## 五、组件映射表
| 页面 | 原型元素 | 目标组件 | 自定义样式 |
|------|---------|---------|-----------|
| Dashboard | 统计卡片 | el-statistic | 背景渐变色 |
| 用户列表 | 数据表格 | el-table | 操作列宽度 |
| ... | ... | ... | ... |

## 六、图表清单（如有）
| 图表类型 | 所在页面 | 数据源 | 尺寸 |
|---------|---------|--------|------|
| 柱状图 | Dashboard | mock.chartData.bar | 100% × 400px |
| 饼图 | Dashboard | mock.chartData.pie | 50% × 350px |
| ... | ... | ... | ... |

## 七、交互逻辑
| 交互类型 | 描述 | 所在页面 | 实现方式 |
|---------|------|---------|---------|
| 表格筛选 | 按用户名/状态筛选 | 用户列表 | el-form + el-input/el-select + watchEffect |
| 新增弹窗 | 点击新增弹出表单 | 用户列表 | el-dialog + el-form + 校验 |
| 批量删除 | 勾选多行删除 | 用户列表 | el-table selection + confirm |
| ... | ... | ... | ... |

## 八、Mock 数据 TypeScript 接口
[每个页面数据源的完整 TS 类型定义]

## 九、构建顺序
1. Vite 脚手架 → 2. 依赖安装 → 3. 主题注入 → 4. 布局框架 → 5. 路由配置 → 6. 状态管理 → 7. Mock 数据 → 8. 逐页转换（按页面清单顺序）

## 十、组件库主题覆盖
[需要覆盖的组件库默认 CSS 变量 → 设计 Token 映射]
```

---

### 阶段 5：初始化项目基础

按框架约定和蓝图创建项目基础结构。详细文件结构见各技术栈参考文档。

**通用构建顺序（按蓝图"构建顺序"章节执行）：**

1. **Vite 脚手架**：`npm create vite@latest` 创建 TypeScript 模板
2. **安装依赖**：组件库 + 路由 + 状态管理 + ECharts（如有图表）
3. **注入设计 Token**：将蓝图中的 Token 变量映射为组件库主题变量（Element Plus CSS Variables / Ant Design ConfigProvider `theme.token`）
4. **搭建布局框架**：创建 `layouts/DefaultLayout` 组件，含侧边栏、顶栏、内容区、面包屑
5. **配置路由**：按蓝图路由树创建 `router/index.ts`，含嵌套路由和路由守卫占位
6. **配置状态管理**：按蓝图创建 Pinia Store / Zustand Store（侧边栏折叠、多标签页、用户信息）
7. **创建 Mock 数据**：按蓝图 TypeScript 接口创建 `utils/mock.ts`
8. **全局样式**：CSS Variables 定义 + reset + 布局工具类

**项目骨架（Vue 3 + Element Plus）：**

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
│   │   └── MultiTabs.vue
│   ├── stores/                      # Pinia stores
│   │   ├── app.ts                   # 侧边栏折叠、多标签页
│   │   └── user.ts                  # 用户信息（占位）
│   ├── router/
│   │   └── index.ts
│   ├── utils/
│   │   └── mock.ts                  # 所有 Mock 数据集中管理
│   ├── styles/
│   │   ├── variables.css            # 设计 Token (CSS Variables)
│   │   └── global.css               # 全局样式 + reset
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**项目骨架（React + Ant Design）：**

```
project/
├── src/
│   ├── layouts/
│   │   └── DefaultLayout.tsx        # 侧边栏+顶栏+内容区+面包屑
│   ├── pages/                       # 业务页面（按路由分组）
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   └── system/
│   │       └── user/
│   │           ├── index.tsx        # 用户列表
│   │           └── detail.tsx       # 用户详情
│   ├── components/                  # 公共组件
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MultiTabs.tsx
│   ├── stores/                      # Zustand stores
│   │   ├── useAppStore.ts
│   │   └── useUserStore.ts
│   ├── router/
│   │   └── index.tsx
│   ├── utils/
│   │   └── mock.ts
│   ├── styles/
│   │   ├── variables.css
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

### 阶段 6：逐页转换

严格按照蓝图"页面清单"顺序逐页转换，**一口气连续完成**所有页面：

**单个页面的转换步骤（4 步）：**

1. **组件识别** — 扫描页面 HTML 片段，匹配蓝图中的组件映射表，列出该页面的组件替换清单
2. **结构转换** — HTML 标签 → 组件库组件 + 布局结构（`<div>` → `<el-card>` / `<Card>`、`<table>` → `<el-table>` / `<Table>` 等）
3. **样式注入** — 组件库默认样式通过 Token 自动覆盖，原型个性化样式写入 `<style scoped>` / CSS Modules
4. **交互绑定** —
   - 表格：排序、筛选、分页、多选 → 组件库事件绑定
   - 表单：校验规则配置、提交处理（Toast 占位）
   - 弹窗/抽屉：显隐状态管理、数据回填
   - 图表：ECharts option 配置、响应式 resize
   - 页面跳转：`router.push` / `useNavigate`
   - 未实现功能：用 `ElMessage.info('功能开发中')` / `message.info('功能开发中')` 占位

**转换顺序：** 先框架布局（Layout + 路由容器），再一级路由页面（Dashboard），最后二级/子级路由页面。

---

### 阶段 7：验证

按照蓝图文件逐条对照验证。详见各技术栈参考文档中的验证 checklist。

**核心验证项：**

```
□ 布局结构   - Sidebar/Header/Content/Breadcrumb 正确渲染，折叠正常
□ 路由导航   - 所有页面可访问，嵌套路由正确，参数传递正确
□ 视觉还原   - Token 覆盖完整，色板/字号/间距/圆角/阴影与原型一致
□ 组件映射   - 所有原型 UI 片段已映射到组件库组件
□ 表格交互   - 排序、筛选、分页、多选正常工作
□ 表单交互   - 校验规则正确，提交弹窗正常
□ 图表渲染   - ECharts 正确初始化，option 与数据对应，响应式 resize 正常
□ 弹窗/抽屉  - 显隐逻辑正确，遮罩正常
□ Mock 数据  - 所有页面数据正确显示，TypeScript 类型无报错
□ 响应式    - 侧边栏折叠，1920×1080 / 1366×768 分辨率布局正常
□ TypeScript - `tsc --noEmit` 无类型错误
□ 构建      - `npm run build` 成功
```

---

## 二、核心转换规则（跨框架通用）

### HTML 标签 → 管理后台组件映射原则

| HTML 原型 | Vue 3 + Element Plus | React + Ant Design | 说明 |
|-----------|---------------------|-------------------|------|
| `<div>` `<section>` `<main>` `<article>` | `<div>` (保留) | `<div>` (保留) | Web 端不限制标签，保留语义化 |
| `<header>` | `<el-header>` 或 `<div>` | `<Layout.Header>` 或 `<div>` | 看是否在 Layout 内 |
| `<aside>` `<nav>` | `<el-menu>` / `<div>` | `<Menu>` / `<div>` | 侧边栏导航 |
| `<table>` `<thead>` `<tbody>` `<tr>` `<td>` | `<el-table>` + `<el-table-column>` | `<Table>` + `columns` 配置 | 组件库数据表格 |
| `<form>` `<input>` `<select>` `<textarea>` | `<el-form>` + `<el-form-item>` + `<el-input>` / `<el-select>` | `<Form>` + `<Form.Item>` + `<Input>` / `<Select>` | 组件库表单 |
| `<button>` | `<el-button>` | `<Button>` | 组件库按钮（含 loading 状态） |
| `<dialog>` `<div class="modal">` | `<el-dialog>` | `<Modal>` | 弹窗 |
| `<canvas>` + 图表 | ECharts `init()` | ECharts `init()` | 共用 ECharts |
| `<ul>` `<li>` 导航菜单 | `<el-menu>` | `<Menu>` | 组件库菜单 |
| `<ul>` `<li>` 普通列表 | `<div>` + `v-for` | `<div>` + `.map()` | 非导航列表保持原样 |
| `<img>` | `<img>` (保留) | `<img>` (保留) | Web 端无需替换 |
| `<a href>` | `<router-link>` / `router.push` | `<Link>` / `useNavigate` | 路由跳转 |
| `<svg>` (图标) | `<el-icon>` / Lucide | `@ant-design/icons` / Lucide | 组件库图标 |
| `<input type="checkbox">` | `<el-checkbox>` | `<Checkbox>` | 组件库多选 |
| `<input type="radio">` | `<el-radio>` | `<Radio>` | 组件库单选 |
| `<select>` | `<el-select>` | `<Select>` | 组件库下拉 |
| `<input type="date">` | `<el-date-picker>` | `<DatePicker>` | 组件库日期 |
| `<input type="file">` | `<el-upload>` | `<Upload>` | 组件库上传 |
| `<progress>` / 进度条 | `<el-progress>` | `<Progress>` | 组件库进度条 |
| 标签/徽标 | `<el-tag>` | `<Tag>` | 组件库标签 |
| 头像 | `<el-avatar>` | `<Avatar>` | 组件库头像 |
| 开关 | `<el-switch>` | `<Switch>` | 组件库开关 |
| 步骤条 | `<el-steps>` | `<Steps>` | 组件库步骤条 |
| 骨架加载 | `<el-skeleton>` | `<Skeleton>` | 组件库骨架屏 |
| 空状态 | `<el-empty>` | `<Empty>` | 组件库空状态 |
| 抽屉/侧边面板 | `<el-drawer>` | `<Drawer>` | 组件库抽屉 |

### 管理系统特有组件映射

| 原型 UI 模式 | Element Plus | Ant Design |
|-------------|-------------|------------|
| 统计卡片（数字+标题） | `<el-statistic>` 或 `<el-card>` | `<Statistic>` 或 `<Card>` |
| 描述列表（label-value 对） | `<el-descriptions>` | `<Descriptions>` |
| 时间线 | `<el-timeline>` | `<Timeline>` |
| 穿梭框（左右列表转移） | `<el-transfer>` | `<Transfer>` |
| 级联选择（多级下拉） | `<el-cascader>` | `<Cascader>` |
| 树形表格 | `<el-table>` + `row-key` + 树数据 | `<Table>` + `children` 数据 |
| 可编辑表格 | `<el-table>` + 行内 `<el-input>` | `<Table>` + `editable` 配置 |
| 搜索 + 表格布局 | `<el-card>` > `<el-form>` + `<el-table>` | `<Card>` > `<Form>` + `<Table>` |
| 弹窗表单 | `<el-dialog>` > `<el-form>` | `<Modal>` > `<Form>` |

### 样式转换原则

管理后台场景与小程序不同，Web 端没有 `rpx` 和选择器限制：

1. **单位**：保留原样（`px`、`rem`、`%`、`vh`/`vw`），不做转换
2. **布局**：优先使用 Flex 布局（管理后台的标准布局方案），Grid 全支持
3. **选择器**：无限制，但组件内部样式用 `<style scoped>` / CSS Modules 隔离
4. **设计 Token**：统一提取为 CSS Variables，注入到 `:root` 和组件库主题变量
5. **组件库覆盖**：通过组件库的 CSS Variables 或 `ConfigProvider` 主题配置覆盖默认样式
6. **图标**：组件库图标组件优先，补充图标使用 Lucide
7. **品味**：骨架屏加载态、空状态引导、圆角卡片、适当留白间距、暗色模式适配
8. **响应式**：侧边栏折叠适配，内容区自适应

详细的组件映射、事件映射、样式规则、路由配置、数据绑定等内容，请查阅对应技术栈的参考文档。

---

## 三、资源

- `scripts/analyze_html.py`：检查 HTML/CSS 文件或目录，输出 JSON 盘点结果，用于规划转换。已适配管理系统场景（额外检测图表容器、表格结构、导航菜单层级、布局区域边界）。
- `references/element-plus.md`：Vue 3 + Element Plus 完整转换参考，包含组件映射、事件映射、样式规则、主题覆盖、布局框架、路由配置、Pinia 状态管理、ECharts 图表、Mock 数据管理、常见陷阱和验证 checklist。
- `references/ant-design.md`：React + Ant Design 完整转换参考，包含组件映射、事件映射、样式规则、主题覆盖、布局框架、路由配置、Zustand 状态管理、ECharts 图表、Mock 数据管理、常见陷阱和验证 checklist。
