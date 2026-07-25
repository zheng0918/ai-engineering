# address — 地址管理代码模板

```xml
<picker mode="region" bindchange="onRegionChange" value="{{region}}">
  <view class="region-picker">
    <text>{{region[0] || '省'}} {{region[1] || '市'}} {{region[2] || '区'}}</text>
    <text class="arrow">›</text>
  </view>
</picker>
```
