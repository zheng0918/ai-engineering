# style — 样式规范

> 本文件规定前端 SCSS/CSS 的编写约束与设计变量。

---

## 1. SCSS 变量（必须）

```scss
// styles/variables.scss
// ===== 主题色 =====
$primary: #409eff;
$success: #67c23a;
$warning: #e6a23c;
$danger: #f56c6c;
$info: #909399;

// ===== 中性色 =====
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$text-placeholder: #c0c4cc;
$border-base: #dcdfe6;
$border-light: #e4e7ed;
$bg-page: #f2f3f5;
$bg-white: #ffffff;

// ===== 字号 =====
$font-xs: 12px;
$font-sm: 13px;
$font-md: 14px;
$font-lg: 16px;
$font-xl: 18px;
$font-xxl: 20px;

// ===== 间距 =====
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-xxl: 24px;

// ===== 圆角 =====
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-round: 9999px;

// ===== 阴影 =====
$shadow-base: 0 2px 4px rgba(0, 0, 0, 0.12);
$shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
```

---

## 2. SCSS Mixin

```scss
// styles/mixins.scss
@mixin text-ellipsis($line: 1) {
  overflow: hidden;
  text-overflow: ellipsis;
  @if $line == 1 { white-space: nowrap; }
  @else {
    display: -webkit-box;
    -webkit-line-clamp: $line;
    -webkit-box-orient: vertical;
  }
}

@mixin flex-center($direction: row) {
  display: flex;
  flex-direction: $direction;
  justify-content: center;
  align-items: center;
}

@mixin scrollbar {
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: $border-base; border-radius: 3px; }
}
```

---

## 3. CSS 命名规范（BEM）

```scss
.user-card {
  display: flex;

  &__avatar { width: 40px; height: 40px; }

  &__info { flex: 1; }

  &--active { border-color: $primary; }
}
```

---

## 4. 禁止事项

- ❌ inline style
- ❌ 硬编码颜色/字号/间距
- ❌ CSS 类名不用 BEM
- ❌ `!important` 滥用
- ❌ 全局样式污染（必须 scoped 或 BEM 隔离）
- ⚠️ **例外**：Element Plus 组件库的全局样式覆盖（如 `.el-table`、`.el-tag`、`.el-pagination`、`.el-dialog` 等）允许写在非 scoped 的覆盖文件中（如 `element-override.scss`），不属于全局污染。此例外也适用于其他第三方 UI 库的默认样式覆盖

---

## 5. 已知问题与规避

> 详见 [issues.md](issues.md) — 典型样式问题排查记录与解决方案

### 5.1 Flex 容器中块级元素宽度塌缩

**现象**：`display: block` 元素作为 flex 容器直接子元素时，不设 `width: 100%` 会导致宽度塌缩到内容最小宽度。

**规避规则**：

| 场景 | 必须检查 |
|------|----------|
| `el-form-item` 内放自定义组件 | 组件根元素是否有 `width: 100%` 或 `flex: 1; min-width: 0`？ |
| CSS Grid 列内放 `el-select` / `el-input` | 容器是否有 `min-width: 0` 防止溢出？ |
| 多层 flex/grid 嵌套 | 每级容器是否有显式宽度约束？ |

**典型案例**：`CascadeSeriesSelect` 在 `el-form-item` 中宽度塌缩 — 根因是 `el-form-item__content` 使用 `display: flex`，而子 div 未设 `width: 100%`，导致 flex item 按 content 而非 available space 计算宽度。→ 详见 [ISSUE-001](issues.md#issue-001-块级元素在-flex-容器中宽度塌缩)
