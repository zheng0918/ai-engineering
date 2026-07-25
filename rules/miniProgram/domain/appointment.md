# appointment — 服务预约

> 适用 `features.appointment.enabled = true`。跨 O2O 类目通用（充电桩/美业/医疗/餐饮）。

## 通用流程

```
选择服务/项目 → 选择日期 → 选择时段 → 选择资源(技师/医生/桩位) → 确认 → 支付 → 到店核销
```

## 日期选择（横向滚动）

```xml
<scroll-view class="date-picker" scroll-x="true">
  <view wx:for="{{dates}}" wx:key="date"
        class="date-item {{item.date === selectedDate ? 'active' : ''}}"
        bindtap="onSelectDate" data-date="{{item.date}}">
    <text class="date-week">{{item.week}}</text>
    <text class="date-day">{{item.day}}</text>
  </view>
</scroll-view>
```

## 时段选择

```xml
<view class="time-slots">
  <view wx:for="{{timeSlots}}" wx:key="time"
        class="time-slot {{item.time === selectedTime ? 'active' : ''}} {{item.booked ? 'disabled' : ''}}"
        bindtap="onSelectTime" data-time="{{item.time}}">
    {{item.time}}
    <text wx:if="{{item.booked}}" class="booked-tag">已约</text>
  </view>
</view>
```

## 资源选择（跨类目差异）

| 类目 | 资源 |
|------|------|
| 充电桩 | 桩位编号/功率 |
| 美业 | 技师列表+头像+评分 |
| 医疗 | 医生列表+职称 |
| 餐饮 | 桌位类型 |

## 到店核销

```js
onShowQrCode: function() {
  this.setData({
    sheetVisible: true, sheetTitle: '到店核销',
    sheetType: 'qr', sheetQrUrl: api.getVerifyQrCode(this.data.orderId)
  });
}
```
