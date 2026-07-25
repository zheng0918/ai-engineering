# utils — 工具函数生成技能

> 本技能生成 Mock 数据、环境配置、请求封装、防抖节流等工具函数。

---

## 一、Mock 数据完整模板（微信原生）

```js
// utils/mock.js — 所有页面 Mock 数据集中管理

// ===== 1. 常量与色板 =====
const STONE_COLORS = {
  white: '#f4f2ee', grey: '#dad6d0', black: '#2c2925',
  blue: '#cdd5da', beige: '#ece2d2', sand: '#e2d0b6',
};

// ===== 2. 首页数据 =====
const homeData = {
  banners: [
    { h: '标题', sub: 'SUBTITLE', tags: '描述文本', stone: 'beige' },
  ],
  series: [
    { id: 'modern', cn: '系列中文名', en: 'Series English', stone: 'grey' },
  ]
};

// ===== 3. 产品数据（工厂函数） =====
function makeProducts(prefix, start, n, stoneList) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      model: prefix + (start - i),
      size: '900x1800mm',
      stone: stoneList[i % stoneList.length],
    });
  }
  return out;
}

const STONE_CYCLE = ['white', 'grey', 'blue', 'beige'];
const initialProducts = makeProducts('SJ-', 1000, 20, STONE_CYCLE);

// ===== 4. 公司数据 =====
const companyData = {
  brandName: '品牌名',
  brandTag: 'BRAND TAG',
  slogan: '品牌 Slogan',
  contact: { phone: '13800000000', address: '详细地址' },
  socialLinks: [
    { name: '微信', type: 'qr', qrUrl: '', glyph: 'wechat' },
    { name: '抖音', type: 'qr', qrUrl: '', glyph: 'douyin' },
  ]
};

// ===== 5. 导出 =====
module.exports = {
  STONE_COLORS, STONE_CYCLE,
  homeData, companyData,
  makeProducts, initialProducts
};
```

## 二、环境配置模板

```js
// utils/config.js
var CONFIG = {
  API_BASE_URL: 'https://api.example.com',
  REQUEST_TIMEOUT: 15000,
};
module.exports = CONFIG;
```

## 三、防抖/节流（微信原生 JS）

```js
// utils/utils.js
function debounce(fn, delay) {
  var timer = null;
  return function() {
    var context = this;
    var args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(context, args); }, delay || 300);
  };
}

function throttle(fn, interval) {
  var last = 0;
  return function() {
    var now = Date.now();
    if (now - last >= (interval || 300)) {
      last = now;
      fn.apply(this, arguments);
    }
  };
}

module.exports = { debounce: debounce, throttle: throttle };
```
