# file-upload — 文件上传生成技能

> 本技能生成微信原生小程序图片/文件上传、URL管理、预览、画廊的完整代码。

---

## 一、图片全链路工具函数（微信原生）

### utils/api.js — URL 管理

```js
/**
 * 图片 URL 统一处理。
 * 服务端返回相对路径 → 完整可访问 URL。
 */
function imageUrl(url) {
  if (!url) return '';
  if (url.indexOf('http') === 0) return url;
  return config.API_BASE_URL + url;
}

/**
 * MinIO/OSS 预签名直链（大文件绕过代理提速）。
 * @param {string} fileUrl - 如 /api/v1/files/product/uuid.mp4
 * @returns {Promise<string>} 预签名完整 URL
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

### 图片上传（multipart）

```js
function uploadFile(filePath) {
  return new Promise(function(resolve, reject) {
    var app = getApp();
    var header = {};
    if (app && app.globalData.isLoggedIn && app.globalData.token) {
      header['Authorization'] = 'Bearer ' + app.globalData.token;
    }

    wx.uploadFile({
      url: config.API_BASE_URL + '/api/v1/upload/image',
      filePath: filePath,
      name: 'file',
      header: header,
      success: function(res) {
        var body = JSON.parse(res.data);  // uploadFile 返回字符串
        if (body && body.code === 0) resolve(body.data);
        else reject(new Error((body && body.message) || '上传失败'));
      },
      fail: function(err) { reject(new Error(err.errMsg || '上传失败')); }
    });
  });
}
```

### 图片预览与保存

```js
/** 预览图片（多图滑动） */
function previewImages(urls, current) {
  wx.previewImage({ urls: urls, current: urls[current || 0] });
}

/** 下载并保存到相册 */
function saveToAlbum(url) {
  wx.downloadFile({
    url: url,
    success: function(res) {
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: function() { wx.showToast({ title: '已保存到相册' }); },
        fail: function() {
          wx.showToast({ title: '保存失败，请检查相册权限', icon: 'none' });
        }
      });
    }
  });
}
```

---

## 二、图片选择 + 上传组件（WXML）

```xml
<!-- 图片选择上传组件 -->
<view class="uploader">
  <view wx:for="{{fileList}}" wx:key="index" class="uploader-item"
        bindtap="onPreviewImage" data-idx="{{index}}">
    <image src="{{item}}" mode="aspectFill" />
    <view class="uploader-delete" catchtap="onRemoveImage" data-idx="{{index}}">×</view>
  </view>
  <view wx:if="{{fileList.length < maxCount}}" class="uploader-add" bindtap="onChooseImage">
    <text>+</text>
  </view>
</view>
```

## 三、图片画廊模板

```xml
<!-- 九宫格画廊 -->
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
