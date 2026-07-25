# sku-selector — SKU 选择器代码模板

## WXML

```xml
<view class="sku-panel">
  <view wx:for="{{specGroups}}" wx:key="name" class="sku-group">
    <text class="sku-group-title">{{item.name}}</text>
    <view class="sku-values">
      <view wx:for="{{item.values}}" wx:key="*this" wx:for-item="val"
            class="sku-val {{selectedSpecs[item.name] === val ? 'active' : ''}} {{isSpecDisabled(item.name, val) ? 'disabled' : ''}}"
            bindtap="onSpecTap" data-group="{{item.name}}" data-value="{{val}}">
        {{val}}
      </view>
    </view>
  </view>
</view>
```

## JS

```js
initSku: function(skuList, specGroups) {
  var defaultSku = skuList.find(function(s) { return s.stock > 0; });
  this.setData({
    skuList: skuList, specGroups: specGroups,
    selectedSpecs: defaultSku ? defaultSku.specs : {},
    currentSku: defaultSku || null
  });
  this.updateSkuInfo();
},
onSpecTap: function(e) {
  var selectedSpecs = Object.assign({}, this.data.selectedSpecs);
  selectedSpecs[e.currentTarget.dataset.group] = e.currentTarget.dataset.value;
  this.setData({ selectedSpecs: selectedSpecs });
  this.updateSkuInfo();
},
updateSkuInfo: function() { /* findSku + 更新 price/stock */ }
```
