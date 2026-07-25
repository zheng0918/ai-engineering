# style — 样式生成技能

> 本技能根据生成 SCSS 变量、mixin、重置样式与工具类。

---

## 生成清单

- `styles/variables.scss`
- `styles/mixins.scss`
- `styles/reset.scss`
- `styles/global.scss`

## reset.scss

```scss
*,
*::before,
*::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

a { text-decoration: none; color: inherit; }
ul, ol { list-style: none; }
img { max-width: 100%; vertical-align: middle; }
```

## global.scss

```scss
@import './reset';
@import './variables';

body {
  font-size: $font-md;
  color: $text-primary;
  background: $bg-page;
  -webkit-font-smoothing: antialiased;
}

// 工具类
.flex-center { @include flex-center; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.text-ellipsis { @include text-ellipsis(1); }
```

## Element Plus 主题覆盖

```scss
// 全局覆盖 Element Plus CSS 变量
:root {
  --el-color-primary: #{$primary};
  --el-color-success: #{$success};
  --el-color-warning: #{$warning};
  --el-color-danger: #{$danger};
}
```
