# validation-checklist — 多端代码校验清单

> **所有端级 agent 执行完毕后，必须按此清单逐项校验。本清单由根 agent 在执行协议的 POST-FLIGHT 阶段加载，作为不可跳过的校验依据。**

---

## 一、后端校验（Backend）

### 1.1 禁止项（命中任一项 = BLOCKER，必须修复）

| # | 检查项 | 扫描方式 | 原因 |
|---|--------|---------|------|
| B01 | `JpaRepository` / `EntityManager` | grep `src/main/java` | 禁用 JPA |
| B02 | `jakarta.persistence` / `javax.persistence` | grep `src/main/java` | 禁用 JPA 注解 |
| B03 | `spring-boot-starter-data-jpa` | grep `pom.xml` | 禁用 JPA Starter |
| B04 | `@Select` / `@Update` / `@Insert` / `@Delete` | grep `src/main/java/**/mapper/` | Mapper 禁止 SQL 注解 |
| B05 | `System.out.println` / `System.err.println` | grep `src/main/java` | 必须用 SLF4J |
| B06 | `printStackTrace()` | grep `src/main/java` | 丢失日志上下文 |
| B07 | 硬编码密钥/密码/token/secret | grep `src/main/java` | 安全底线 |

### 1.2 必须项（缺失任一项 = BLOCKER，必须修复）

| # | 检查项 | 要求 |
|---|--------|------|
| B08 | Mapper 接口 | `extends BaseMapper<Entity>` + `@Mapper`，无 SQL 注解 |
| B09 | Mapper XML | `resources/mapper/XxxMapper.xml` 存在（若有自定义 SQL） |
| B10 | Service 接口 | `extends IService<Entity>` |
| B11 | ServiceImpl | `extends ServiceImpl<Mapper, Entity> implements Service` |
| B12 | Controller | 只注入 Service，不注入 Mapper |
| B13 | 响应体 | 统一使用 `R<T>`，成功用 `R.success()` |
| B14 | Entity | 继承 `model/base/BaseEntity` |
| B15 | Query | 继承 `model/base/PageQuery`，命名为 `XxxQuery` |
| B16 | 分页 | 列表接口使用 `Page<T>` + `PageResult<T>` |
| B17 | 事务 | 写方法含 `@Transactional(rollbackFor = Exception.class)` |

### 1.3 VO/DTO 质量（缺失任一项 = ERROR）

| # | 检查项 | 要求 |
|---|--------|------|
| B18 | VO Long ID | `@JsonSerialize(using = ToStringSerializer.class)` |
| B19 | VO LocalDateTime | `@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")` |
| B20 | VO 敏感字段 | 不含 password/token/secret/salt/deleted |
| B21 | DTO 校验 | 含 `@Valid` + `@NotNull`/`@NotBlank`/`@Size` 等 |

### 1.4 数据库（缺失任一项 = ERROR）

| # | 检查项 | 要求 |
|---|--------|------|
| B22 | 建表 COMMENT | 每张业务表必有 `COMMENT ON TABLE` + `COMMENT ON COLUMN` |
| B23 | 审计列 | 必含 tenant_id / created_by / updated_by / deleted_at / created_at / updated_at |
| B24 | 迁移文件 | Flyway 命名 `V{version}__{description}.sql` + 头部注释（目的/破坏性/依赖/幂等） |
| B25 | 索引 | 含 `WHERE deleted_at IS NULL` 条件索引 |

### 1.5 日志规范

| # | 检查项 | 要求 |
|---|--------|------|
| B26 | 日志框架 | SLF4J + Logback，禁止 `log4j` 直接使用 |
| B27 | 日志级别 | 允许 `log.info` / `log.warn` / `log.error`；`log.debug` / `log.trace` 仅限开发环境 |
| B28 | 日志语言 | 中文 |
| B29 | 禁止项 | 无 `System.out` / `System.err` / `printStackTrace` |

---

## 二、前端校验（Frontend）

### 2.1 禁止项（命中任一项 = BLOCKER）

| # | 检查项 | 扫描方式 | 原因 |
|---|--------|---------|------|
| F01 | Options API / Class 组件 | grep `.vue` 文件 | 必须 Composition API |
| F02 | `var ` 声明 | grep `*.ts` `*.vue` | 必须 const/let |
| F03 | inline style | grep `style=` | 必须 class + SCSS |
| F04 | 硬编码 API URL | grep `http.get('http` / `http.post('http` | 必须用 env + 模块拆分 |
| F05 | 硬编码路由路径 | grep `router.push('/` 或 `router.push("/` | 必须用路由 name |

### 2.2 必须项（缺失任一项 = BLOCKER）

| # | 检查项 | 要求 |
|---|--------|------|
| F06 | `<script setup lang="ts">` | 所有 `.vue` 文件 |
| F07 | API 封装拦截器 | `request.ts` 含请求拦截（token 注入）+ 响应拦截（code 判断） |
| F08 | 路由守卫 | `router/guard.ts` 含 token 检查 + 白名单 + redirect 回跳 |
| F09 | 页面四态 | 每个数据页面必须覆盖 loading / error / empty / normal |
| F10 | 操作反馈 | 请求 → loading，成功 → toast，失败 → toast + 原因 |
| F11 | 删除确认 | 删除操作必须有二次确认弹窗（非浏览器 confirm） |
| F12 | 表单校验 | 所有表单项必须有校验规则 |

### 2.3 类型与样式质量（缺失任一项 = ERROR）

| # | 检查项 | 要求 |
|---|--------|------|
| F13 | `any` 类型 | 禁止泛滥使用，仅限明确的边界场景 |
| F14 | Props 类型 | 所有组件 Props 必须有 TypeScript 类型声明 |
| F15 | CSS scoped | 组件样式必须 `scoped` 或使用 BEM 命名 |
| F16 | CSS 变量 | 颜色/间距使用 SCSS 变量，禁止硬编码色值 |
| F17 | 全局样式 | 禁止全局样式污染（reset/variables 除外） |

### 2.4 可访问性（缺失任一项 = WARN）

| # | 检查项 | 要求 |
|---|--------|------|
| F18 | 表单 label | 所有 input/select 必须有关联 label |
| F19 | 按钮文本 | 图标按钮必须有 aria-label 或 title |
| F20 | 颜色对比度 | 正文与背景对比度 ≥ 4.5:1（推荐） |
| F21 | 键盘导航 | Tab 可聚焦所有交互元素（推荐） |

### 2.5 Token 与鉴权

| # | 检查项 | 要求 |
|---|--------|------|
| F22 | Token 存储键名 | 统一使用 `token`（非 accessToken/jwt/authToken） |
| F23 | Token 过期 | code=2004 → 清除 token + 跳转 /login |
| F24 | 退出清理 | logout 时清除 localStorage 中 token + userInfo |

---

## 三、小程序校验（MiniProgram）

### 3.1 禁止项（命中任一项 = BLOCKER）

| # | 检查项 | 要求 |
|---|--------|------|
| M01 | Options API / Class 组件 | 必须 Composition API |
| M02 | `var` 声明 | 必须 const/let |
| M03 | 裸用 `uni.request` / `wx.request` | 必须用封装的 request.ts |
| M04 | 硬编码路由路径 | 必须用 PAGES 常量 |
| M05 | inline style | 必须 class + SCSS |
| M06 | Storage 不加前缀 | 防止多项目冲突 |

### 3.2 必须项（缺失任一项 = BLOCKER）

| # | 检查项 | 要求 |
|---|--------|------|
| M07 | `<script setup lang="ts">` | 所有 `.vue` 文件 |
| M08 | API 封装拦截器 | request.ts 含 token 注入 + code 判断 |
| M09 | 页面四态 | 每个数据页面必须覆盖 loading / error / empty / normal |
| M10 | 下拉刷新 | 列表页必须支持 `onPullDownRefresh` |
| M11 | 触底加载 | 列表页必须支持 `onReachBottom` |
| M12 | Token 持久化 | 必须 `uni.setStorageSync('token')` |

### 3.3 类型与样式质量（缺失任一项 = ERROR）

| # | 检查项 | 要求 |
|---|--------|------|
| M13 | `any` 类型 | 禁止 — 特别检查 `ref<any>` / `ref<any[]>` / `reactive<any>` |
| M14 | SCSS 变量 | 颜色使用 SCSS 变量，禁止硬编码 |
| M15 | rpx 单位 | 样式单位使用 rpx（非 px） |
| M16 | scoped | 组件样式必须 scoped |

### 3.4 微信特有

| # | 检查项 | 要求 |
|---|--------|------|
| M17 | wx.login | 小程序登录必须先调 `wx.login()` 获取 code |
| M18 | 订阅消息 | 需用户主动触发（按钮点击），不能自动弹起 |
| M19 | 分享 | 核心页面必须实现 `onShareAppMessage` |

---

## 四、跨端联动校验（Link）

### 4.1 契约一致性（缺失任一项 = BLOCKER）

| # | 检查项 | 要求 |
|---|--------|------|
| L01 | URL 路径 | 三端一致（含 `/api/v1` 前缀） |
| L02 | HTTP 方法 | 三端一致（GET/POST/PUT/DELETE） |
| L03 | Query 参数名 | 统一 pageNum/pageSize（非 page/page_size） |
| L04 | Body 字段名 | 统一 camelCase |
| L05 | Path 参数 | 位置一致（`:id` 在末尾） |

### 4.2 数据格式（缺失任一项 = BLOCKER）

| # | 检查项 | 要求 |
|---|--------|------|
| L06 | Long ID | 后端 `@JsonSerialize(ToStringSerializer)` → 前端/小程序 type `string` |
| L07 | 日期格式 | 统一 `yyyy-MM-dd HH:mm:ss` |
| L08 | BigDecimal | 后端序列化为 string → 前端/小程序 type `string` |

### 4.3 鉴权与错误码（缺失任一项 = ERROR）

| # | 检查项 | 要求 |
|---|--------|------|
| L09 | Token 存储键名 | 三端统一为 `token` |
| L10 | Token 传输头 | 三端统一 `Authorization: Bearer {token}` |
| L11 | Token 过期码 | 三端统一 code=2004 → 跳转登录 |
| L12 | 错误码 | 后端 ErrorCode 在前端/小程序有对应处理 |
| L13 | 响应体结构 | 三端统一 `{ code, message, data, traceId }` |

### 4.4 类型同步（缺失任一项 = ERROR）

| # | 检查项 | 要求 |
|---|--------|------|
| L14 | VO ↔ TS 字段 | 一一对应，无多余/缺失字段 |
| L15 | 字段可选性 | `@NotNull`/基本类型 → TS 必填；包装类型无注解 → TS 可选 |
| L16 | DTO ↔ TS 字段 | 一一对应 |

---

## 五、全局禁止项（跨端）

| # | 检查项 | 严重度 |
|---|--------|--------|
| G01 | 代码中硬编码密钥/密码/token/secret | BLOCKER |
| G02 | 响应体/日志输出敏感字段 | BLOCKER |
| G03 | 文件缺失（引用但不存在） | BLOCKER |
| G04 | 目录结构不符合规范 | ERROR |

---

## 六、规范缺口补充说明

> 以下项目当前仓库尚未覆盖，标记为建议补充项，不阻塞校验通过。

| # | 建议补充 | 优先级 | 说明 |
|---|---------|--------|------|
| S01 | 测试规范 | HIGH | 建议新增 `{端}/test/` 子模块，覆盖单元测试 + 集成测试 |
| S02 | 性能/SLA 规范 | MEDIUM | 建议定义响应时间目标、N+1 查询防控、缓存策略 |
| S03 | Git 提交规范 | MEDIUM | 建议定义 commit message 格式（如 Conventional Commits） |
| S04 | 代码审查 Checklist | MEDIUM | 建议定义 PR review 必检项 |
| S05 | 国际化 (i18n) 规范 | LOW | 当前配置中有开关但无具体规范 |
| S06 | 监控/告警规范 | LOW | 当前仅有 traceId 透传，建议补充 metrics + health check |

---

## 校验执行协议

```
1. 按端顺序执行校验（Backend → Frontend → MiniProgram → Link）
2. BLOCKER 项 → 立即停止 → 修复 → 重新校验
3. ERROR 项 → 记录 → 修复 → 重新校验（不阻断其他端）
4. WARN 项 → 记录 → 输出建议但不阻断
5. 每轮修复后重新运行全部校验（防止修复引入新问题）
6. 最多 3 轮 → 第 3 轮仍有 BLOCKER/ERROR → 上报用户
```
