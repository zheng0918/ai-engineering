# DemoList 知识库

> 各端历史踩坑记录与解决方案。按「端 → 维度」两级索引，每维度一个 `.md` 文件，按时间倒序追加。

---

## 索引

### miniProgram（18 个维度）

| 维度 | 文件 | 涵盖问题域 |
|------|------|-----------|
| pages | [pages.md](miniProgram/pages.md) | 四态/分页/骨架屏/列表/详情/表单 |
| components | [components.md](miniProgram/components.md) | Sheet/Swiper/卡片/SKU/购物车/倒计时/优惠券/物流/星级/地区选择器 |
| api | [api.md](miniProgram/api.md) | 请求封装/拦截器/预签名URL/imageUrl |
| store | [store.md](miniProgram/store.md) | 状态管理/购物车同步/订单状态/globalData |
| router | [router.md](miniProgram/router.md) | 路由配置/TabBar/分包/页面注册 |
| style | [style.md](miniProgram/style.md) | 设计Token/CSS变量/图标/字体/WXSS/BEM |
| authorization | [authorization.md](miniProgram/authorization.md) | 登录/手机号/隐私合规/游客体验/登录Sheet |
| payment | [payment.md](miniProgram/payment.md) | 支付/退款/回调/双重确认/超时释放 |
| share | [share.md](miniProgram/share.md) | 分享配置/onShareAppMessage/from归因/Timeline |
| file-upload | [file.md](miniProgram/file-upload.md) | 图片全链路/视频DRM/进度同步/预签名/画廊 |
| error-handling | [error.md](miniProgram/error-handling.md) | 错误分类/弱网/重试/网络状态监听 |
| deployment | [deployment.md](miniProgram/deployment.md) | 构建/CI/setData优化/分包策略/首屏指标 |
| interaction | [interaction.md](miniProgram/interaction.md) | Toast/Modal/Loading/Sheet/空状态 |
| cache | [cache.md](miniProgram/cache.md) | Storage策略/过期/同步/Key前缀 |
| notification | [notification.md](miniProgram/notification.md) | 订阅消息/模板管理/授权时机 |
| mock | [mock.md](miniProgram/mock.md) | Mock数据结构/工厂函数/切换策略/集中管理 |
| project-structure | [project-structure.md](miniProgram/project-structure.md) | 骨架/分包/命名/技术选型 |

### backend（17 个维度）

| 维度 | 文件 |
|------|------|
| controller | [controller.md](backend/controller.md) |
| service | [service.md](backend/service.md) |
| mapper | [mapper.md](backend/mapper.md) |
| entity-design | [entity-design.md](backend/entity-design.md) |
| dto-vo | [dto-vo.md](backend/dto-vo.md) |
| exception | [exception.md](backend/exception.md) |
| validation | [validation.md](backend/validation.md) |
| security | [security.md](backend/security.md) |
| cache | [cache.md](backend/cache.md) |
| feign | [feign.md](backend/feign.md) |
| mq | [mq.md](backend/mq.md) |
| scheduled | [scheduled.md](backend/scheduled.md) |
| logging | [logging.md](backend/logging.md) |
| database | [database.md](backend/database.md) |
| deployment | [deployment.md](backend/deployment.md) |
| config | [config.md](backend/config.md) |
| project-structure | [project-structure.md](backend/project-structure.md) |

### frontend（20 个维度）

| 维度 | 文件 |
|------|------|
| pages | [pages.md](frontend/pages.md) |
| components | [components.md](frontend/components.md) |
| layout | [layout.md](frontend/layout.md) |
| form | [form.md](frontend/form.md) |
| table | [table.md](frontend/table.md) |
| api | [api.md](frontend/api.md) |
| store | [store.md](frontend/store.md) |
| router | [router.md](frontend/router.md) |
| style | [style.md](frontend/style.md) |
| hooks | [hooks.md](frontend/hooks.md) |
| authorization | [authorization.md](frontend/authorization.md) |
| permission | [permission.md](frontend/permission.md) |
| error-handling | [error-handling.md](frontend/error-handling.md) |
| cache | [cache.md](frontend/cache.md) |
| interaction | [interaction.md](frontend/interaction.md) |
| deployment | [deployment.md](frontend/deployment.md) |
| utils | [utils.md](frontend/utils.md) |
| config | [config.md](frontend/config.md) |
| project-structure | [project-structure.md](frontend/project-structure.md) |

### prd（4 个维度）

| 维度 | 文件 |
|------|------|
| feature-switch | [feature-switch.md](prd/feature-switch.md) |
| page-spec | [page-spec.md](prd/page-spec.md) |
| data-model | [data-model.md](prd/data-model.md) |
| api-contract | [api-contract.md](prd/api-contract.md) |

### prototype（8 个维度）

| 维度 | 文件 |
|------|------|
| page-structure | [page-structure.md](prototype/page-structure.md) |
| layout | [layout.md](prototype/layout.md) |
| design-tokens | [design-tokens.md](prototype/design-tokens.md) |
| components | [components.md](prototype/components.md) |
| interactions | [interactions.md](prototype/interactions.md) |
| data-model | [data-model.md](prototype/data-model.md) |
| icon-set | [icon-set.md](prototype/icon-set.md) |
| responsive | [responsive.md](prototype/responsive.md) |

### system-design（7 个维度）

| 维度 | 文件 |
|------|------|
| architecture | [architecture.md](system-design/architecture.md) |
| api-design | [api-design.md](system-design/api-design.md) |
| data-model | [data-model.md](system-design/data-model.md) |
| state-machine | [state-machine.md](system-design/state-machine.md) |
| deployment | [deployment.md](system-design/deployment.md) |
| security | [security.md](system-design/security.md) |
| integration | [integration.md](system-design/integration.md) |

---

## 使用方式

1. 遇到问题并解决后 → 确定所属端 + 维度
2. 在该维度 `.md` 文件**最顶部**（`# 标题` 下方）追加：

```markdown
## YYYY-MM-DD: {一句话问题标题}

### 场景
### 问题
### 根因
### 方案
### 代码
```

3. 更新本 README 中对应维度的「涵盖问题域」（如有新增关键词）
