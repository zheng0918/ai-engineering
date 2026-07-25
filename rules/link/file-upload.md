# file-upload — 文件上传对接规范

> 本文件规定文件上传接口在三端的统一约束，包括请求格式、大小限制、类型校验、进度回调。

---

## 1. 后端上传接口

### 1.1 Controller

```java
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    @Operation(summary = "文件上传")
    public R<FileVO> upload(@RequestParam("file") MultipartFile file) {
        return R.success(fileService.upload(file));
    }

    @PostMapping("/upload/batch")
    @Operation(summary = "批量上传")
    public R<List<FileVO>> uploadBatch(@RequestParam("files") List<MultipartFile> files) {
        return R.success(fileService.uploadBatch(files));
    }
}
```

### 1.2 文件大小限制

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 50MB
```

### 1.3 后端校验

```java
// FileService
public FileVO upload(MultipartFile file) {
    if (file.isEmpty()) {
        throw new BizException(ErrorCode.FILE_UPLOAD_FAILED, "文件为空");
    }
    if (file.getSize() > 10 * 1024 * 1024) {
        throw new BizException(ErrorCode.FILE_SIZE_EXCEED);
    }
    String ext = FilenameUtils.getExtension(file.getOriginalFilename());
    if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
        throw new BizException(ErrorCode.FILE_TYPE_UNSUPPORTED);
    }
    // ... 存储逻辑
}
```

### 1.4 响应 VO

```java
@Data
public class FileVO {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;
    private String url;          // 访问 URL
    private String originalName; // 原始文件名
    private Long size;           // 文件大小（字节）
}
```

---

## 2. 前端上传

### 2.1 API 封装

```ts
// api/modules/upload.ts
import http from '../request';

/** 上传文件（带进度） */
export const uploadFile = (file: File, onProgress?: (pct: number) => void) => {
  const form = new FormData();
  form.append('file', file);
  return http.post<FileVO>('/api/v1/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};

/** 批量上传 */
export const uploadFiles = (files: File[], onProgress?: (pct: number) => void) => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return http.post<FileVO[]>('/api/v1/upload/batch', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};
```

### 2.2 前端预校验

```ts
// utils/uploadValidator.ts
const MAX_SIZE = 10 * 1024 * 1024;  // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
                        'application/pdf', 'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_SIZE) return '文件大小不能超过 10MB';
  if (!ALLOWED_TYPES.includes(file.type)) return '不支持的文件格式';
  return null; // 校验通过
};
```

### 2.3 Element Plus 上传组件

```vue
<el-upload
  :http-request="customUpload"
  :before-upload="beforeUpload"
  :show-file-list="false"
>
  <el-button type="primary">上传文件</el-button>
</el-upload>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { uploadFile } from '@/api/modules/upload';
import { validateFile } from '@/utils/uploadValidator';

const progress = ref(0);

const beforeUpload = (file: File) => {
  const err = validateFile(file);
  if (err) { ElMessage.error(err); return false; }
  return true;
};

const customUpload = async (options: any) => {
  progress.value = 0;
  try {
    const res = await uploadFile(options.file, (pct) => { progress.value = pct; });
    ElMessage.success('上传成功');
    emit('uploaded', res);
  } catch {
    // 已由拦截器提示
  }
};
</script>
```

---

## 3. 小程序上传

### 3.1 图片选择

```ts
// utils/chooseImage.ts
export const chooseImage = (count = 1): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],  // 压缩图
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths),
      fail: reject,
    });
  });
};
```

### 3.2 上传 API 封装

```ts
// api/upload.ts
import { useUserStore } from '@/store/user';

const BASE_URL = import.meta.env.VITE_API_BASE;

export const uploadFile = (filePath: string, onProgress?: (pct: number) => void): Promise<FileVO> => {
  const userStore = useUserStore();

  return new Promise((resolve, reject) => {
    const uploadTask = uni.uploadFile({
      url: BASE_URL + '/api/v1/upload',
      filePath,
      name: 'file',
      header: {
        'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
      },
      success: (res) => {
        const { code, message, data } = JSON.parse(res.data);
        if (code === 0) resolve(data as FileVO);
        else if (code === 2004) { useUserStore().logout(); reject(new Error(message)); }
        else { uni.showToast({ title: message || '上传失败', icon: 'none' }); reject(new Error(message)); }
      },
      fail: () => {
        uni.showToast({ title: '上传失败，请检查网络', icon: 'none' });
        reject(new Error('上传失败'));
      },
    });

    // 进度回调
    if (onProgress) {
      uploadTask.onProgressUpdate((res) => {
        onProgress(res.progress);
      });
    }
  });
};
```

### 3.3 使用示例

```vue
<script setup lang="ts">
import { chooseImage } from '@/utils/chooseImage';
import { uploadFile } from '@/api/upload';

const images = ref<string[]>([]);
const uploading = ref(false);

const onChooseAndUpload = async () => {
  try {
    const paths = await chooseImage(9);
    uploading.value = true;
    for (const path of paths) {
      const res = await uploadFile(path);
      images.value.push(res.url);
    }
    uni.showToast({ title: '上传成功', icon: 'success' });
  } catch {
    // 已处理
  } finally {
    uploading.value = false;
  }
};
</script>
```

---

## 4. 三端上传对照表

| 环节 | 后端 | Frontend | MiniProgram |
|---|---|---|---|
| 请求格式 | `multipart/form-data` | `FormData` + `Content-Type: multipart/form-data` | `uni.uploadFile` |
| 字段名 | `@RequestParam("file")` | `form.append('file', file)` | `name: 'file'` |
| 大小限制 | `spring.servlet.multipart.max-file-size` | 前端预校验 | 前端预校验 |
| 类型限制 | Service 层校验 | `before-upload` 校验 | `sizeType: ['compressed']` |
| 进度 | — | `onUploadProgress` | `uploadTask.onProgressUpdate` |
| Token | `JwtAuthFilter` | 拦截器自动注入 | 手动设置 header |
| 响应 | `R<FileVO>` | 拦截器解包 → `FileVO` | JSON.parse 手动解包 |

---

## 5. 禁止事项

- ❌ 上传接口不校验 token（导致未授权上传）
- ❌ 文件大小只在前端校验，后端不兜底
- ❌ 文件类型只在前端校验，后端不兜底
- ❌ 小程序 `uni.uploadFile` 不传 Authorization header
- ❌ 使用 `uni.request` 代替 `uni.uploadFile` 上传文件
- ❌ 上传路径用 `wx.uploadFile` 代替统一封装的 `uploadFile`
- ❌ 文件存储路径暴露在响应中（如本地绝对路径）
- ❌ 上传成功不返回文件 URL
