# table - 表格规范

> 本文件规定表格的数据列配置、分页、操作列、状态列及 CSS 设计规范。
>
> **优先级声明**：本文件定义的样式默认值（颜色/字号/间距/圆角等）在 spec 文档或原型 HTML 提供了不同设计系统时，以 spec/原型为准。本文件中的值为通用默认，可被原型覆盖。

---

## 1. 表格容器结构

```
.panel                    ← 外层面板：白色背景、边框、圆角、阴影
  .panel-hd               ← 标题栏：flex | space-between | padding 16px 20px
    h3                    ← 表格标题：16px | font-weight 600
    .panel-hd-right       ← 右侧操作区：flex | gap 10px | 放按钮/筛选/计数
  .panel-body             ← 内容区：padding 20px
    .table-wrap           ← 横向滚动容器：overflow-x auto
      table               ← 表格本体
      .pagination         ← 分页组件（在 panel-body 内、table-wrap 外）
```

---

## 2. 表格核心 CSS

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;        /* 固定列宽，翻页不抖动 */
}

th {
  text-align: center;
  padding: 12px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);        /* #6B6778 */
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

td {
  text-align: center;
  padding: 12px 10px;
  border-bottom: 1px solid var(--line2);
  color: var(--ink);          /* #1A1A1E */
  font-size: 13px;
  letter-spacing: 0.2px;
  white-space: nowrap;        /* 禁止换行 */
}

tr:hover td {
  background: #F7F6FA;        /* 行悬停高亮 */
}
```

---

## 3. 列宽与对齐规范

| 列位置 | 选择器 | 宽度 | 对齐 | 说明 |
|--------|--------|------|------|------|
| 首列（排序/序号/编号） | `th:first-child, td:first-child` | 80px | center | 短数字，居中整齐 |
| 次列（标题/名称） | `th:nth-child(2), td:nth-child(2)` | auto | center | 自适应，内容驱动 |
| 末列（操作） | `th:last-child, td:last-child` | 180px | center | 容纳 3 个操作按钮 |
| 中间列 | 默认 | 自动均分 | center | table-layout:fixed 下自动分配 |

```css
th:first-child, td:first-child { text-align: center; width: 80px; }
th:nth-child(2), td:nth-child(2) { width: auto; }
th:last-child, td:last-child { text-align: center; padding-right: 20px; width: 180px; }
```

**规则：**
- 首列和末列不允许紧贴面板边缘，padding 自然留出空间
- 所有列内容禁止换行（`white-space: nowrap`）
- 列宽基于内容合理分配，不使用硬编码的 px 值覆盖内容需求

---

## 4. 状态标签（Badge）

```css
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.badge-active   { background: #E8F4EC; color: var(--success); }  /* 上架/正常 - 绿底绿字 */
.badge-inactive { background: #FDF0F0; color: #C44D4D; }         /* 下架/停用 - 红底红字 */
```

**使用时：**
```html
<span class="badge badge-active">上架</span>
<span class="badge badge-inactive">下架</span>
```

---

## 5. 操作列（Actions Cell）

```css
.actions-cell {
  display: flex;
  gap: 6px;
  justify-content: flex-end;    /* 按钮右对齐 */
  align-items: center;          /* 垂直居中 */
}
.actions-cell button {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.3px;
  transition: 0.15s;
}

/* 三类操作按钮颜色 */
.btn-edit   { color: var(--info); }       /* 编辑 - 灰蓝 #6B6778 */
.btn-edit:hover   { background: #F4F3F8; }
.btn-del    { color: var(--danger); }      /* 删除 - 红色 #D14343 */
.btn-del:hover    { background: #FDF0F0; }
.btn-toggle { color: var(--muted); }       /* 上下架 - 灰色 #6B6778 */
.btn-toggle:hover { background: #F7F6FA; }
```

**规则：**
- 操作列不显示状态列（状态已有独立列）
- 每行最多 3 个操作按钮（编辑 / 切换状态 / 删除）
- 删除操作需系统 Modal 确认，不允许使用浏览器 `confirm()`

---

## 6. 表格列配置清单

每个业务表格的列定义：

| 页面 | 列顺序 |
|------|--------|
| 仪表盘（概览） | 模块, 数量, 已上架, 状态 |
| 轮播图管理 | 排序, 标题, 副标题, 类型, 状态, 操作 |
| 产品管理 | 编号, 名称, 所属系列, 规格, 类型, 状态, 操作 |
| 海报管理 | 排序, 标题, 海报图片, 状态, 操作 |
| 社交入口 | 排序, 名称, 类型, 内容, 操作 |
| 收藏记录 | 序号, 用户标识, 产品编号, 系列名称, 规格, 类型, 收藏时间 |
| 厂商信息 | 标签, 值（双列表，非数据表格） |

**规则：**
- 有数据的表格必须包含序号/排序/编号列作为首列
- 收藏记录需要关联查询产品数据以展示系列名称、规格、类型
- 厂商信息为只读双列详情表，无操作列

---

## 7. 分页组件（Pagination）

```css
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;     /* 居中 */
  gap: 6px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line2);
}
.pagination button {
  width: 34px; height: 34px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  color: var(--muted);
  transition: 0.15s;
  border: 1px solid transparent;
}
.pagination button:hover        { background: var(--bg); border-color: var(--line); }
.pagination button.active       { background: var(--panel); color: var(--nav-active); font-weight: 600; }
.pagination button:disabled     { color: var(--faint); pointer-events: none; opacity: 0.4; }
.pagination .page-info          { font-size: 13px; color: var(--muted); margin: 0 8px; }
.pagination select.page-size    { height: 30px; border: 1px solid var(--line); border-radius: 4px;
                                  padding: 0 6px; font-size: 12px; color: var(--muted);
                                  background: var(--surface); cursor: pointer; margin-left: 10px; }
```

**组件结构：**
```
[共X条 / Y页]  [上一页] [1] [2] [3] [下一页]  [3条/页 ▾]
```

**规则：**
- 分页在面板内部（panel-body 内）、表格下方
- 默认每页 3 条（演示）/ 正式环境 20 条
- 必须提供页容量选择器：3 / 5 / 10 / 20 条/页
- 单页时仍展示分页栏（显示"共X条 / 1页"），仅隐藏翻页按钮
- 切换页容量时重置到第 1 页
- 分页居中展示

---

## 8. 颜色标记（Color Tokens）

表格相关 CSS 变量：

| 变量 | 值 | 用途 |
|------|-----|------|
| `--surface` | #FFFFFF | 面板/表格背景 |
| `--ink` | #1A1A1E | 表格正文 |
| `--muted` | #6B6778 | 表头/次要文本 |
| `--faint` | #9D9BA5 | 辅助文字 |
| `--line` | #EBEBEE | 表头底部边框 |
| `--line2` | #F4F4F6 | 行底部分隔线 |
| `--success` | #3E8E5E | 上架/正常绿 |
| `--danger` | #D14343 | 删除/停用红 |
| `--info` | #6B6778 | 编辑按钮蓝灰 |
| `--panel` | #1C1C20 | 深色（分页激活/按钮） |
| `--nav-active` | #EBE9F0 | 深色底白字 |
| `--bg` | #FAFAFA | 页面底色 |

---

## 9. 字体层级

| 元素 | 字号 | 字重 | 说明 |
|------|------|------|------|
| 面板标题 `.panel-hd h3` | 16px | 600 | 表格区域主标题 |
| 表头 `th` | 12px | 600 | 列标签 |
| 表体 `td` | 13px | 400 | 数据内容（不加粗） |
| 状态标签 `.badge` | 11px | 600 | 小标签 |
| 操作按钮 `.actions-cell button` | 12px | 400 | 编辑/删除/切换 |
| 分页按钮 `.pagination button` | 13px | 400 | 页码 |
| 分页信息 `.page-info` | 13px | 400 | "共X条" |
| 分页选择 `select.page-size` | 12px | 400 | 条/页下拉 |
| 表单标签 `label` | 13px | 500 | 弹窗内标签 |
| 表单提示 `.form-hint` | 12px | 400 | 补充说明 |

**规则：**
- 正文统一 13px，不加粗
- 标题 16px，表头 12px，形成 16→12→13 三级字号层次
- 所有编号/名称/标题/内容使用 sans-serif（Fira Sans + Noto Sans SC），禁止使用衬线体作为数据展示字体

---

## 10. 禁止事项

- 表格数据列不使用 `font-weight: 600`（已全部取消加粗）
- 编号/型号列不使用衬线字体（`font-family: var(--serif)`）
- 操作列不显示"下架"按钮（社交入口页）
- 不使用浏览器原生 `confirm()` 弹窗（改用系统 Modal）
- 表格内容不允许换行
- 首列和末列不允许紧贴面板边缘
- 分页组件不在表格外部渲染（必须在 panel-body 内）
