# components — 组件生成技能

> 本技能生成基础组件（BaseTable/BaseForm/BaseDialog）与业务组件模板。

---

## BaseDialog 模板（通用弹窗封装）

```vue
<template>
  <el-dialog v-model="visible" :title="title" :width="width" :close-on-click-modal="false" draggable @closed="handleClosed">
    <div class="dialog-body" v-loading="loading">
      <slot />
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="$emit('confirm')">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props { title?: string; width?: string; loading?: boolean; modelValue: boolean; }
const props = withDefaults(defineProps<Props>(), { title: '弹窗', width: '600px', loading: false });
const emit = defineEmits<{ 'update:modelValue': [val: boolean]; confirm: []; closed: []; }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, (v) => { visible.value = v; });
watch(visible, (v) => emit('update:modelValue', v));

const handleClosed = () => emit('closed');
</script>
```

---

## 页面级弹窗组件（UserFormDialog 示例）

```vue
<template>
  <BaseDialog v-model="visible" :title="isEdit ? '编辑用户' : '新增用户'" :loading="submitting" @confirm="handleSubmit" @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" />
      </el-form-item>
    </el-form>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { getUserDetail, createUser, updateUser } from '@/api/modules/user';
import BaseDialog from '@/components/base/BaseDialog/index.vue';

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();
const editId = ref('');

const form = reactive({ username: '' });
const rules = { username: [{ required: true, message: '请输入用户名', trigger: 'blur' }] };

const open = async (id?: string) => {
  visible.value = true;
  if (id) {
    isEdit.value = true;
    editId.value = id;
    const detail = await getUserDetail(id);
    Object.assign(form, detail);
  }
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    isEdit.value ? await updateUser(editId.value, form) : await createUser(form);
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
    visible.value = false;
    emit('success');
  } finally { submitting.value = false; }
};

const resetForm = () => {
  formRef.value?.resetFields();
  isEdit.value = false;
  editId.value = '';
};

defineExpose({ open });
</script>
```
