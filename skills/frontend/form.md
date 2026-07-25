# form — 表单生成技能

> 本技能生成表单组件（含校验规则、自定义校验、提交逻辑）。

---

## 表单组件模板

```vue
<template>
  <div class="form-page" v-loading="loading">
    <el-card>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const loading = ref(false);
const submitting = ref(false);
const isEdit = ref(false);
const form = reactive({ name: '' });
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] };

const onSubmit = async () => { /* 校验 + 提交 */ };
</script>
```
