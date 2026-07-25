# exam — 考试代码模板

```xml
<radio-group bindchange="onAnswerChange" data-idx="{{index}}">
  <label wx:for="{{item.options}}" wx:key="*this" wx:for-item="opt">
    <radio value="{{opt}}" />{{opt}}
  </label>
</radio-group>
```
