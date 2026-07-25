# file-upload — 文件上传规范

> 本文件规定小程序图片/文件上传的约束与实现。

---

## 1. 上传类型

| 类型 | API | 限制 |
|---|---|---|
| 图片 | `uni.chooseImage` + `uni.uploadFile` | 单张 ≤ 10MB，最多 9 张 |
| 视频 | `uni.chooseVideo` + `uni.uploadFile` | 单次 ≤ 50MB |
| 文件 | `uni.chooseFile` + `uni.uploadFile` | 单次 ≤ 10MB |

---

## 2. 上传封装

```ts
// utils/upload.ts
import { useUserStore } from '@/store/user';
import { env } from '@/config/env';

const BASE_URL = env.API_BASE;

export const uploadImage = (filePath: string): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/api/v1/upload/image',
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${useUserStore().token}`,
      },
      success(res) {
        const body = JSON.parse(res.data);
        if (body.code === 0) resolve(body.data);
        else reject(new Error(body.message));
      },
      fail() {
        reject(new Error('上传失败'));
      },
    });
  });
};

export const uploadImages = async (paths: string[]): Promise<string[]> => {
  const results = await Promise.all(paths.map((p) => uploadImage(p).catch(() => '')));
  return results.filter(Boolean);
};
```

---

## 3. 图片选择 + 预览

```ts
// utils/image.ts

/** 选择图片（压缩 + 限制数量） */
export const chooseImages = (count = 9): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths),
      fail: (err) => reject(err),
    });
  });
};

/** 预览图片 */
export const previewImages = (urls: string[], current = 0): void => {
  uni.previewImage({ urls, current });
};

/** 保存图片到相册 */
export const saveImage = async (url: string): Promise<void> => {
  const { tempFilePath } = await uni.downloadFile({ url });
  await uni.saveImageToPhotosAlbum({ filePath: tempFilePath });
  uni.showToast({ title: '已保存到相册' });
};
```

---

## 4. 上传组件模板

```vue
<template>
  <view class="uploader">
    <view v-for="(url, index) in fileList" :key="index" class="uploader__item"
          @click="previewImages(fileList, index)">
      <image :src="url" mode="aspectFill" />
      <view class="uploader__delete" @click.stop="removeImage(index)">×</view>
    </view>
    <view v-if="fileList.length < maxCount" class="uploader__add" @click="handleAdd">
      <text>+</text>
      <text>上传图片</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { chooseImages, previewImages } from '@/utils/image';
import { uploadImages } from '@/utils/upload';

const props = withDefaults(defineProps<{ maxCount?: number }>(), { maxCount: 9 });
const emit = defineEmits<{ change: [urls: string[]] }>();

const fileList = ref<string[]>([]);

const handleAdd = async () => {
  uni.showLoading({ title: '上传中' });
  try {
    const paths = await chooseImages(props.maxCount - fileList.value.length);
    const urls = await uploadImages(paths);
    fileList.value.push(...urls);
    emit('change', fileList.value);
  } catch (e) { uni.showToast({ title: '上传失败', icon: 'none' }); }
  finally { uni.hideLoading(); }
};

const removeImage = (index: number) => {
  fileList.value.splice(index, 1);
  emit('change', fileList.value);
};
</script>
```

---

## 5. 图片全链路处理（微信原生）

> 图片不只是"上传"，而是"选择 → 上传 → URL 管理 → 预览 → 保存"的完整链路。

### 5.1 全链路流程

```
选择图片                        上传
wx.chooseImage({              wx.uploadFile({
  count,                        url, filePath, name:'file',
  sizeType:['compressed'],      header: { Authorization }
  sourceType:['album','camera'] })
})                            → 后端返回 { url: 相对路径 }
→ tempFilePaths[]                 ↓
                              URL 统一管理
                              imageUrl(url) → 完整可访问 URL
                                  ↓
                              页面展示
                              <image src="{{imageUrl}}" />
                                  ↓
                              点击预览
                              wx.previewImage({ urls, current })
                                  ↓
                              保存到相册
                              wx.saveImageToPhotosAlbum({ filePath })
```

### 5.2 URL 统一管理函数（必须）

```js
// utils/api.js
/**
 * 图片 URL 统一处理。
 * 服务端返回的相对路径 → 完整可访问 URL。
 */
function imageUrl(url) {
  if (!url) return '';
  if (url.indexOf('http') === 0) return url;  // 已是完整 URL
  return config.API_BASE_URL + url;            // 相对路径拼接 base
}
```

### 5.3 对象存储预签名 URL（大文件加速）

```js
/**
 * 获取 MinIO / OSS 预签名直链。
 * 大文件（视频/高清图）直连对象存储，不经过后端代理。
 */
function getPresignedUrl(fileUrl) {
  var prefix = '/api/v1/files/';
  var idx = fileUrl.indexOf(prefix);
  if (idx === -1) return Promise.resolve(fileUrl);
  var key = fileUrl.substring(idx + prefix.length);
  return baseRequest({
    url: '/api/v1/files/presign?key=' + encodeURIComponent(key),
  });
}
```

### 5.4 图片预览与保存

```js
/** 预览图片（支持多图滑动） */
function previewImages(urls, current) {
  wx.previewImage({
    urls: urls,
    current: urls[current || 0]
  });
}

/** 保存图片到相册（需先下载） */
function saveImage(url) {
  wx.downloadFile({
    url: url,
    success: function(res) {
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: function() { wx.showToast({ title: '已保存到相册' }); },
        fail: function() { wx.showToast({ title: '保存失败', icon: 'none' }); }
      });
    }
  });
}
```

---

## 6. 图片画廊（微信原生）

```xml
<!-- 九宫格图片展示 -->
<view class="gallery">
  <image wx:for="{{images}}" wx:key="index"
         src="{{item}}" mode="aspectFill"
         class="gallery-img"
         bindtap="onPreviewImage" data-idx="{{index}}"
         lazy-load="{{true}}" />
</view>
```

```css
.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  padding: 0 18rpx;
}
.gallery-img {
  width: calc((100% - 16rpx) / 3);
  aspect-ratio: 1;
  border-radius: 12rpx;
  background: var(--line-soft);
}
```

---

---

## 7. 禁止事项

- ❌ 上传前不压缩（原图直传浪费流量）
- ❌ 上传无进度提示
- ❌ 上传失败不做重试
- ❌ 可上传超过 9 张图（微信限制）
