# logistics — 物流轨迹

> 适用 `features.ecommerce.enabled = true`。

## 时间轴组件：最新节点高亮，其余置灰。

```css
.logistics-dot.active { background: var(--brand); }
.logistics-node.latest .logistics-desc { color: var(--brand); font-weight: 600; }
```
