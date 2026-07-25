# deployment — 构建发布技能

> 本技能生成微信原生小程序构建脚本、CI/CD 配置、性能优化清单与发布前检查项。

---

## 一、微信原生构建命令

```json
{
  "scripts": {
    "dev": "微信开发者工具打开项目，选择 miniprogram/ 目录",
    "build": "微信开发者工具 → 上传 → 填写版本号和描述",
    "ci:upload": "node scripts/upload.js"
  }
}
```

## 二、miniprogram-ci 自动化上传

```bash
npm install miniprogram-ci -D
```

```js
// scripts/upload.js
const ci = require('miniprogram-ci');

const project = new ci.Project({
  appid: 'wx1234567890',
  type: 'miniProgram',
  projectPath: 'miniprogram',
  privateKeyPath: './private.key',
  ignores: ['node_modules/**/*']
});

ci.upload({
  project,
  version: process.env.VERSION || '1.0.0',
  desc: process.env.DESC || '自动上传',
  setting: {
    es6: true,
    minify: true,
    autoPrefixWXSS: true
  }
}).then(function(res) {
  console.log('上传成功', res);
}).catch(function(err) {
  console.error('上传失败', err);
  process.exit(1);
});
```

## 三、setData 优化检查清单

- [ ] 避免在 `onPageScroll` 中频繁 setData（使用节流）
- [ ] 避免每次 setData 传递超过 256KB 数据
- [ ] 长列表使用路径更新：`this.setData({ 'list[' + idx + '].status': 'done' })`
- [ ] 合并连续 setData 调用为一次：`this.setData({ a: 1, b: 2, c: 3 })`
- [ ] 不在 `onUnload` 后调用 setData

## 四、分包策略检查清单

- [ ] 主包仅含 TabBar 页面 + 全局资源（目标 < 2MB）
- [ ] 分包按业务模块组织（`pages/goods/`、`pages/order/`）
- [ ] 首页配置了 `preloadRule` 预下载高频分包
- [ ] 低频页面（设置/协议/关于）放在独立分包

## 五、图片性能检查清单

- [ ] 列表图片使用 `lazy-load="{{true}}"`
- [ ] 图片设固定宽高（避免重排）
- [ ] 大图使用 `mode="aspectFill"` 裁剪
- [ ] 上传前压缩（`sizeType: ['compressed']`）

## 六、发布前完整检查清单

- [ ] API 地址切换到生产环境
- [ ] 微信小程序 AppID 正确（非测试号）
- [ ] 服务器域名已配置（request / uploadFile / downloadFile）
- [ ] 隐私接口已配置（`__usePrivacyCheck__: true`）
- [ ] 无 `console.log` 遗留
- [ ] 图标资源文件齐全（无 404）
- [ ] 分包不超过限制（主包 < 2MB / 总 < 20MB）
- [ ] 版本号递增（`project.config.json` 中 `version`）
- [ ] 首屏骨架屏正常显示
- [ ] 分享标题/图片在各页面正确

## 七、体验评分

使用微信开发者工具 → 体验评分，确保：

- 性能 ≥ 85 分
- 体验 ≥ 85 分
- 最佳实践 ≥ 90 分
