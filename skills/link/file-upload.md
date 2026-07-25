# file-upload — 文件上传对接生成技能

> 本技能生成三端文件上传相关代码，确保上传流程（选择 → 预校验 → 上传 → 进度 → 响应）完整贯通。

---

## 触发条件

当需要"实现文件上传"、"添加图片上传"、"对接上传接口"时触发。

---

## 生成清单

- 后端：`FileController` + `FileService` + `FileVO`
- 前端：`api/modules/upload.ts` + `utils/uploadValidator.ts` + 上传组件
- 小程序：`api/upload.ts` + `utils/chooseImage.ts`

---

## 前端完整上传组件模板（Element Plus）

```vue
<template>
  <div>
    <el-upload
      :http-request="handleUpload"
      :before-upload="handleBefore"
      :show-file-list="false"
      :disabled="uploading"
    >
      <slot>
        <el-button :loading="uploading" type="primary">
          {{ uploading ? `上传中 ${progress}%` : '点击上传' }}
        </el-button>
      </slot>
    </el-upload>
    <el-progress v-if="uploading" :percentage="progress" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadRequestOptions } from 'element-plus';
import { uploadFile } from '@/api/modules/upload';
import { validateFile } from '@/utils/uploadValidator';
import type { FileVO } from '@/api/types/file';

const emit = defineEmits<{
  uploaded: [file: FileVO];
}>();

const uploading = ref(false);
const progress = ref(0);

const handleBefore = (file: File) => {
  const err = validateFile(file);
  if (err) { ElMessage.error(err); return false; }
  return true;
};

const handleUpload = async (options: UploadRequestOptions) => {
  uploading.value = true;
  progress.value = 0;
  try {
    const res = await uploadFile(options.file, (pct) => { progress.value = pct; });
    ElMessage.success('上传成功');
    emit('uploaded', res);
  } catch {
    // 已由拦截器提示
  } finally {
    uploading.value = false;
  }
};
</script>
```

---

## 小程序完整上传模板

```ts
// utils/upload.ts
import { useUserStore } from '@/store/user';

const BASE_URL = import.meta.env.VITE_API_BASE;

interface UploadResult {
  id: string;
  url: string;
  originalName: string;
  size: number;
}

/** 选择并上传图片 */
export const chooseAndUpload = async (count = 1): Promise<UploadResult[]> => {
  // 1. 选择图片
  const paths = await new Promise<string[]>((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths),
      fail: (err) => reject(err),
    });
  });

  // 2. 依次上传
  const results: UploadResult[] = [];
  for (const path of paths) {
    const result = await uploadSingle(path);
    results.push(result);
  }
  return results;
};

/** 上传单个文件 */
export const uploadSingle = (filePath: string): Promise<UploadResult> => {
  const userStore = useUserStore();

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/api/v1/upload',
      filePath,
      name: 'file',
      header: {
        'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
      },
      success: (res) => {
        const { code, message, data } = JSON.parse(res.data);
        if (code === 0) resolve(data as UploadResult);
        else if (code === 2004) { useUserStore().logout(); reject(new Error(message)); }
        else { uni.showToast({ title: message || '上传失败', icon: 'none' }); reject(new Error(message)); }
      },
      fail: () => {
        uni.showToast({ title: '上传失败，请检查网络', icon: 'none' });
        reject(new Error('网络异常'));
      },
    });
  });
};
```

---

## 生成时注意事项

1. **后端 `@RequestParam("file")` 的 name 必须与前端 FormData key 一致**
2. **前端 `Content-Type` 必须为 `multipart/form-data`**（否则后端无法解析）
3. **小程序 `uni.uploadFile` 不走统一拦截器**：token 必须手动设置到 header
4. **大小和类型必须双重校验**：前端拦截（快速反馈）+ 后端兜底（安全底线）
5. **进度回调仅在前端/小程序**：后端不需要
6. **上传响应结构统一**：`R<FileVO>` — id + url + originalName + size
