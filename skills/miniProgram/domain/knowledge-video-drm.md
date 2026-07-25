# video-drm — 视频保护代码模板

```js
api.getSignedPlayUrl(courseId, lessonId).then(function(signedUrl) {
  this.setData({ videoUrl: signedUrl });
  this.videoContext = wx.createVideoContext('courseVideo');
}.bind(this));
```
