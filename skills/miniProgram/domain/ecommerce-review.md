# review — 评价代码模板

```xml
<view class="star-rating">
  <text wx:for="{{[1,2,3,4,5]}}" wx:key="*this"
        class="star {{item <= rating ? 'active' : ''}}"
        bindtap="onRate" data-rating="{{item}}">
    {{item <= rating ? '★' : '☆'}}
  </text>
</view>
```
