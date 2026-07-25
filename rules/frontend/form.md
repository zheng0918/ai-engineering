# form — 表单规范

> 本文件规定 Element Plus 表单的校验、布局与提交约束。

---

## 1. 表单布局

```vue
<el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">
  <el-row :gutter="20">
    <el-col :span="12">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入" maxlength="64" show-word-limit />
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-col>
  </el-row>
  <el-form-item>
    <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
    <el-button @click="$router.back()">取消</el-button>
  </el-form-item>
</el-form>
```

---

## 2. 校验规则

```ts
import type { FormRules } from 'element-plus';

const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 64, message: '2-64 字符', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '邮箱格式错误', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur' },
  ],
  url: [
    { type: 'url', message: 'URL 格式错误', trigger: 'blur' },
  ],
};
```

---

## 3. 自定义校验

```ts
const validatePassword = (_rule: any, value: string, callback: Function) => {
  if (!value) callback(new Error('请输入密码'));
  else if (value.length < 6) callback(new Error('密码至少 6 位'));
  else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) callback(new Error('需包含大小写字母和数字'));
  else callback();
};
```

---

## 4. 表单提交流程

```
1. formRef.validate() → 校验
2. 校验通过 → submitting = true
3. 调 API → 成功 → ElMessage.success → 关闭/跳转
4. 失败 → ElMessage.error → submitting = false
5. finally → submitting = false
```

---

## 5. 禁止事项

- ❌ 表单不校验直接提交
- ❌ 提交按钮无 loading
- ❌ 提示信息不清晰（"请输入" → "请输入用户名"）
- ❌ 必填项无 `required` 标记

---

## 6. 布局陷阱

> 表单布局中常见宽度问题，详见 [style/issues.md](../style/issues.md)

### 6.1 el-form-item 内组件未铺满

`el-form-item__content` 使用 `display: flex; align-items: center`，直接子元素若为 `display: block` 且未设 `width: 100%` 会导致宽度塌缩。

**必须检查**：`el-form-item` 包裹的任何自定义 `div`/组件，其根元素是否需要显式 `width: 100%` 或 `flex: 1; min-width: 0`。

**参考**：[ISSUE-001: 块级元素在 Flex 容器中宽度塌缩](../style/issues.md#issue-001-块级元素在-flex-容器中宽度塌缩)
