# countdown — 倒计时组件

> 秒杀/支付/拼团通用。必须以服务端时间戳为基准。

```js
function startCountdown(that, endTime, onEnd) {
  function tick() {
    var remain = endTime - Date.now();
    if (remain <= 0) { clearInterval(that._countdownTimer); if (onEnd) onEnd(); return; }
    var h = Math.floor((remain % 86400000) / 3600000);
    var m = Math.floor((remain % 3600000) / 60000);
    var s = Math.floor((remain % 60000) / 1000);
    that.setData({ countdown: { h: pad(h), m: pad(m), s: pad(s) } });
  }
  tick();
  that._countdownTimer = setInterval(tick, 1000);
}
```

## 禁止事项

- ❌ 使用客户端本地时间（用户可以修改）
