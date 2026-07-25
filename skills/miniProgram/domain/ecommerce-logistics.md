# logistics — 物流代码模板

```xml
<view class="logistics-timeline">
  <view wx:for="{{logisticsList}}" wx:key="index" class="logistics-node {{index === 0 ? 'latest' : ''}}">
    <view class="logistics-dot {{index === 0 ? 'active' : ''}}"></view>
    <view class="logistics-content">
      <text class="logistics-desc">{{item.context}}</text>
      <text class="logistics-time">{{item.time}}</text>
    </view>
  </view>
</view>
```
