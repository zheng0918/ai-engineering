# video-drm — 视频内容保护

> 适用 `features.knowledge.enabled = true`。付费视频防盗链/下载。

## 签名 URL

```
后端验证登录态+购买状态 → 生成临时签名 URL（expire + token）
→ 前端 video 组件播放 → URL 过期后重新请求
```

## 播放进度同步（30s 防抖）

```js
var lastSync = 0;
onVideoTimeUpdate: function(e) {
  if (Date.now() - lastSync < 30000) return;
  lastSync = Date.now();
  api.syncProgress({ courseId, lessonId, position: e.detail.currentTime });
}
```

## 断点续播

onLoad 时获取上次播放位置 → >5s 弹窗询问"是否继续"

## 禁止事项

- ❌ 签名 URL 不过期（永久有效=永久盗链）
- ❌ 进度同步频率过高（<10s 一次浪费带宽）
