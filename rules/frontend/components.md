# components — 组件规范

> 本文件规定前端组件的分类、Props/Emits 类型与设计约束。

---

## 1. 组件分类

| 类型 | 位置 | 示例 |
|---|---|---|
| 基础组件 | `components/base/` | BaseTable、BaseForm、BaseDialog |
| 业务组件 | `components/biz/` | UserCard、GoodsSelector |

---

## 2. 组件模板

```vue
<template>
  <div class="user-card" @click="handleClick">
    <el-avatar :src="data.avatar" :size="40" />
    <div class="user-card__info">
      <span class="user-card__name">{{ data.username }}</span>
      <span class="user-card__role">{{ data.role }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户卡片组件。
 */
interface Props {
  data: { id: string; username: string; avatar?: string; role: string };
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), { disabled: false });

const emit = defineEmits<{
  click: [id: string];
}>();

const handleClick = () => {
  if (!props.disabled) emit('click', props.data.id);
};
</script>

<style lang="scss" scoped>
.user-card {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  background: $bg-white;
  border-radius: $radius-md;
  cursor: pointer;

  &__info {
    flex: 1;
    margin-left: $spacing-md;
  }

  &__name {
    font-size: $font-md;
    color: $text-primary;
    @include text-ellipsis;
  }

  &__role {
    font-size: $font-xs;
    color: $text-secondary;
    margin-top: 2px;
  }
}
</style>
```

---

## 3. Props / Emits 规范

```ts
// Props 必须 TypeScript interface
interface Props {
  data: XxxData;
  loading?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
});

// Emits 必须类型声明
const emit = defineEmits<{
  click: [id: string];
  change: [value: any];
  close: [];
}>();
```

---

## 4. 禁止事项

- ❌ Props 无类型定义
- ❌ 组件内直接调 API
- ❌ CSS 类名不用 BEM
- ❌ 组件目录无 `index.vue` 入口
