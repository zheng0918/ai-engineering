# coupon — 优惠券代码模板

```xml
<view class="coupon-card {{item.status}}">
  <view class="coupon-left">
    <text class="coupon-amount">¥<text class="coupon-num">{{item.amount}}</text></text>
    <text class="coupon-condition">满{{item.minAmount / 100}}元可用</text>
  </view>
  <view class="coupon-right">
    <text class="coupon-name">{{item.name}}</text>
    <text class="coupon-date">{{item.startDate}} - {{item.endDate}}</text>
  </view>
</view>
```
