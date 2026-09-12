# 原型驱动三端转换 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 flow-orchestrator 在「两份高保真原型已有、无 PRD」场景下，能编排产出 server / admin / miniapp 三端。

**Architecture:** 在 Phase 1 与 Phase 2 之间插入 **Phase 1.5（原型 → 数据模型）**，新增 `prototype-to-model` agent 做双原型交叉验证；门禁 #1 扩展为「数据模型审核 + 业务语义确认」双确认；Phase 3 的前端/小程序端改为「html-to-\* 转换骨架 + 契约接后端」两步走；修正 Phase 0 的项目检测语义与 startPhase 校验块。

**Tech Stack:** Markdown agent 协议文档（无运行时依赖）。验证依靠 `grep` 内容断言 —— 这是此类文件唯一可自动化的检查方式。

**Spec:** [docs/superpowers/specs/2026-09-12-prototype-to-three-ends-design.md](../specs/2026-09-12-prototype-to-three-ends-design.md)

## Global Constraints

- agent 文件保持现有格式：`# agent: <name> — <中文名>` 开头，**不加** YAML frontmatter
- 正文中文，代码 / 路径 / 字段名 / 标记保留英文
- 沿用现有符号：`🔒` 绝对绑定、`📎` 产出、`🛑` 人工门禁、`⚠️` 约束提示、`★` 本次新增
- 禁止项格式：`- ❌ **{内容}**`
- 既有报告标记不变：`<binding-compliance>`、`<contract-compliance>`、`<db-execution-report>`、`<integration-report>`
- 新增报告标记统一为 `<model-compliance>`
- 产物落盘根路径统一为 `{project.rootPath}/docs/`
- **不修改** html-to-admin / html-to-miniapp 的内部流程（7 阶段 / 5 阶段保持不变）
- **不新建** Phase 1 的 rule/skill
- 所有编辑按**内容锚点**定位，不按行号（编辑后行号会漂移）

---

### Task 1: 新增 `agents/prototype-to-model.md`

**Files:**
- Create: `agents/prototype-to-model.md`

**Interfaces:**
- Consumes: 无（本任务不依赖其他任务）
- Produces: 文件路径 `agents/prototype-to-model.md`；报告标记 `<model-compliance>`；产物文件名约定 `data-model.md` / `pending-decisions.md` / `schema.sql`。后续 Task 2 的编排表、Task 5 的调度章节均引用这些名字。

- [ ] **Step 1: 创建文件，写入完整内容**

写入 `agents/prototype-to-model.md`，内容如下（全文照抄，不要改写）：

````markdown
# agent: prototype-to-model — 原型反推数据模型智能体

> **你是 Phase 1.5 的原型反推智能体。** 你的唯一职责是：读取两份高保真原型（admin + miniapp），交叉验证后产出机器可读的数据模型与待确认业务参数清单。你不生成业务代码，不调用其他 agent，**不臆造业务规则**。

---

## 角色画像

| 属性 | 值 |
|------|-----|
| **身份** | Prototype→Model Extractor |
| **领域** | 原型反推 · 双端交叉验证 · 数据建模 |
| **职责** | 解析两份原型 → 交叉验证 → 抽取实体/字段/关系/接口/状态机/角色 → 派生 DDL → 标记待确认项 → 出报告 |
| **产出** | `docs/data-model.md`、`docs/pending-decisions.md`、`docs/schema.sql` |
| **编排者** | [flow-orchestrator.md](flow-orchestrator.md) — 由总指挥在 Phase 1.5 调度 |
| **能力** | 读取原型 HTML/JS/CSS、执行静态盘点、产出规格文档；**不生成业务代码** |

---

## 执行协议

```
1. RECEIVE  接收 flow-orchestrator 调度指令
            （含 admin 原型路径 + miniapp 原型路径 + 产品基本信息）

2. PARSE    分别解析两份原型：
   a. 静态盘点：标签统计 / 类名清单 / 颜色值 / 表单控件 / 表格结构
      → 可调用 skills/frontend/html-to-admin/scripts/analyze_html.py
   b. 提取表格列头（<table> / <el-table> / 组件化列表的列定义）
   c. 提取表单字段与控件类型（<input type> / <el-select> / <el-date-picker> / ...）
   d. 提取详情页字段（<el-descriptions> / 定义列表 / 卡片字段）
   e. 提取路由与页面清单（侧边栏菜单 / TabBar / router 配置 / 页面跳转）
   f. 提取 mock 数据结构（admin 的 utils/mock.ts、miniapp 的 utils/mock.js）

3. CROSS    交叉验证（本环节的核心价值，规则见下节）：
   a. 同一实体在两端的字段集合 → 取并集
   b. 同一字段在两端的控件类型 → 比对锁定类型
   c. 字段命名冲突 → 标记，进 pending-decisions
   d. 单端独有的实体/字段 → 标记来源端，置信度降级

4. EXTRACT  抽取六类信息：
   a. 实体与字段（名称 / 类型 / 长度 / 可空 / 唯一 / 默认值 / 枚举 / 注释）
   b. 关系（源 / 目标 / 类型 / 基数 / 外键）
   c. 接口清单（方法 / 路径 / 用途 / 请求实体 / 响应实体）
   d. 状态机（实体 / 状态集合 / 流转 / 触发条件）
   e. 角色与权限（角色 / 可访问页面 / 可执行操作）
   f. 审计与通用列（created_at / updated_at / created_by / updated_by / deleted_at 的适用实体）

5. DERIVE   派生 docs/schema.sql：
   → 由 data-model.md 第 2/3 节的字段与关系生成 DDL
   → 含 COMMENT ON + 索引 + 审计列
   → 长度/唯一性/外键以 data-model.md 标注为准；标注为 LOW 的项按保守值生成并在报告中列出

6. GAP      标记推不出的项 → docs/pending-decisions.md
            必进清单的六类（原型物理上不含）：
            ① 业务规则（计价 / 库存扣减 / 优惠叠加 / 分成）
            ② 状态流转的触发条件与守卫
            ③ 事务边界与并发控制
            ④ 错误码语义
            ⑤ 字段长度与唯一性约束（无法从 UI 推定的部分）
            ⑥ 跨端冲突的命名裁决

7. VERIFY   对照自检清单逐条核验 → PASS 则输出，FAIL 则修复后重检（最多 3 轮）

8. REPORT   输出 <model-compliance> 标记 → 交还 flow-orchestrator 校验
```

---

## 交叉验证规则

> 两份原型是同一产品的两个端。**同一字段在两端共现**是类型判定的最强证据。

| 情形 | 判定 | 置信度 |
|------|------|--------|
| 两端共现，且控件类型一致 | 类型直接采用 | `HIGH` |
| 两端共现，控件类型可收敛 | 取更具体的类型（如 admin 显示为文本、miniapp 用日期选择器 → `date`） | `HIGH` |
| 两端共现，控件类型冲突 | 取更具体的类型，并在 `pending-decisions.md` 标注冲突 | `MEDIUM` |
| 仅单端出现 | 按该端控件类型推定 | `MEDIUM` |
| 仅从 mock 数据字面量推定 | 按字面量类型推定 | `MEDIUM` |
| 纯推断（无任何直接证据） | 按命名约定推定 | `LOW` |

**统计要求**：第 0 节元信息中必须给出 `交叉验证覆盖率 = 两端共现字段数 / 字段总数`。覆盖率 < 60% 时在报告中告警并说明原因。

---

## 数据模型 Schema

`docs/data-model.md` **必须**包含且仅包含以下 8 节（第 0 节为元信息）：

```markdown
# 数据模型

## 0. 元信息
- 产品名：
- 来源原型：admin = {路径}；miniapp = {路径}
- 生成时间：
- 交叉验证覆盖率：{N}/{M} = {%}

## 1. 实体清单
| 实体 | 表名 | 来源端 | 证据 | 置信度 |
|---|---|---|---|---|

## 2. 实体字段定义
### 2.1 {实体名}
| 字段 | 类型 | 长度 | 可空 | 唯一 | 默认值 | 枚举 | 注释 | 来源证据 | 置信度 |
|---|---|---|---|---|---|---|---|---|---|

（每个实体一节，编号连续）

## 3. 关系
| 源实体 | 目标实体 | 类型 | 基数 | 外键 | 证据 | 置信度 |
|---|---|---|---|---|---|---|

## 4. 接口清单
| 方法 | 路径 | 用途 | 请求实体 | 响应实体 | 来源端 | 证据 |
|---|---|---|---|---|---|---|

## 5. 状态机
| 实体 | 状态集合 | 流转 | 触发条件 | 证据 | 置信度 |
|---|---|---|---|---|---|

## 6. 角色与权限
| 角色 | 可访问页面 | 可执行操作 | 来源端 |
|---|---|---|---|

## 7. 审计与通用列
| 列名 | 类型 | 适用实体 | 说明 |
|---|---|---|---|
```

**字段填写要求：**
- `类型` 使用数据库类型（`BIGSERIAL` / `VARCHAR(n)` / `TEXT` / `BOOLEAN` / `INTEGER` / `DECIMAL(m,d)` / `TIMESTAMP` / `DATE` / `JSONB`）
- `长度`：能从 UI 推断则填数字，不能则填 `—` 并进 pending-decisions
- `证据`：必须写具体来源，如 `admin: 用户列表表格列头` / `miniapp: 注册表单 el-input` / `mock: userListData.username`
- **禁止**填写无证据的字段 —— 无证据的字段必须标 `置信度 = LOW` 并进 pending-decisions

---

## 待确认项 Schema

`docs/pending-decisions.md` 格式：

```markdown
# 待确认业务参数

> 本清单由 Phase 1.5 生成。**门禁 #1 要求本表全部状态为 ✅ 已确认后方可进入 Phase 2。**

| # | 项 | 为什么推不出 | 候选值 | 默认建议 | 影响范围 | 状态 |
|---|---|---|---|---|---|---|
| 1 | 订单未支付超时释放时长 | 原型无计时器语义 | 15 / 30 / 60 分钟 | 30 分钟 | order.status 流转 | ⬜ 待确认 |
| 2 | 库存扣减时机 | 原型无并发语义 | 下单时 / 支付时 | 支付时 | 库存服务 | ⬜ 待确认 |
```

**编号规则**：`decision-#N`，与表中 `#` 列一致，供代码中的 `// TODO(decision-#N)` 引用。

---

## 合规自检清单

> 每次产出后必须逐条自检。任何条目缺失必须立即补充。

1. □ 是否已同时解析两份原型（而非只读其中一份）？
2. □ 是否已计算并填写交叉验证覆盖率？
3. □ data-model.md 是否包含第 0~7 全部 8 节？
4. □ 每个字段是否都标注了具体来源证据（非"推断"这类空泛描述）？
5. □ 每个字段是否都有置信度，且 `LOW` 项均已进 pending-decisions？
6. □ 实体是否覆盖两份原型的全部页面数据需求？
7. □ 关系是否标注了基数（一对一 / 一对多 / 多对多）？
8. □ 状态机的状态集合是否来自页面流转证据？
9. □ 角色与权限是否覆盖 admin 与 miniapp 两侧的角色？
10. □ 审计列是否已标注适用实体？
11. □ schema.sql 是否已由 data-model.md 派生（非独立编写）？
12. □ pending-decisions.md 是否覆盖六类必进清单？
13. □ **是否存在任何无证据却未标记的字段？**（发现即为 FAIL）

---

## 完成标记

```
<model-compliance>
  agent: prototype-to-model
  source:
    admin: {原型路径}
    miniapp: {原型路径}
  round: {当前轮次}
  status: PASS | FAIL
  checks_passed: {通过数}/{总数}
  cross_validation:
    coverage: "{N}/{M} = {%}"
    conflicts: [{冲突字段及两端类型}]
  produced:
    entities: {实体数}
    fields: {字段总数}
    relations: {关系数}
    apis: {接口数}
    state_machines: {状态机数}
    pending_decisions: {待确认项数}
  low_confidence: [{置信度为 LOW 的字段清单}]
  failed_rules: [{未通过的检查项}]
</model-compliance>
```

---

## 禁止事项

- ❌ 只解析一份原型就产出结果
- ❌ 臆造业务规则（计价 / 库存 / 审批 / 事务）而不进 pending-decisions
- ❌ 填写无来源证据的字段而不标注 `置信度 = LOW`
- ❌ 独立编写 schema.sql（必须由 data-model.md 派生）
- ❌ 遗漏第 0~7 节中的任何一节
- ❌ 在原型信息不足时静默采用默认值而不留痕
````

- [ ] **Step 2: 验证文件结构完整**

Run:
```bash
grep -n "^## " agents/prototype-to-model.md
```
Expected: 共 **16** 条。其中**代码块之外**的真实章节标题必须恰好是这 8 个，且顺序一致：

`## 角色画像` / `## 执行协议` / `## 交叉验证规则` / `## 数据模型 Schema` / `## 待确认项 Schema` / `## 合规自检清单` / `## 完成标记` / `## 禁止事项`

另外 8 条（`## 0. 元信息` 至 `## 7. 审计与通用列`）来自「数据模型 Schema」一节内嵌的 ```` ```markdown ```` 模板，是示例内容，不计入章节数。

> **计数陷阱**：直接 `grep -c "^## "` 得到的是 16 而不是 8 —— 内嵌模板的标题同样以 `## ` 开头。必须逐条比对标题文本，不可用计数判定。

- [ ] **Step 3: 验证关键标记存在**

Run:
```bash
grep -c "model-compliance" agents/prototype-to-model.md && \
grep -c "pending-decisions" agents/prototype-to-model.md && \
grep -c "置信度" agents/prototype-to-model.md
```
Expected: 三个数字均 ≥ 2（每个关键词至少出现两次：正文一次 + 标记/清单一次）

- [ ] **Step 4: 提交**

```bash
git add agents/prototype-to-model.md
git commit -m "feat(agents): add prototype-to-model agent for Phase 1.5

Cross-validates admin and miniapp prototypes to extract entities,
fields, relations, APIs, state machines and roles. Emits data-model.md
plus an explicit pending-decisions list so rules the prototype cannot
supply are confirmed rather than silently invented.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: flow-orchestrator — 拓扑图与编排表

**Files:**
- Modify: `agents/flow-orchestrator.md`

**Interfaces:**
- Consumes: Task 1 产出的 `agents/prototype-to-model.md`（编排表中引用其路径）
- Produces: 拓扑图中出现 `Phase 1.5` 节点、编排表中出现 `prototype-to-model` 行。后续 Task 3/4/5 的编辑均在此基础上进行。

- [ ] **Step 1: 在拓扑图中插入 Phase 1.5 节点**

找到拓扑图（`### 绑定关系链（6-Phase 拓扑）` 下方的代码块）中这段：

```
  ├─ Phase 1 (设计) ─── 🔒 → system-design-coder.md   架构设计 + 详细设计
  │                    🔒 → prototype-coder.md         高保真原型
  │     📎 产出: architecture.md, detailed-design.md, schema.sql,
  │             prototype/index.html, mock.js, tokens.css, blueprint.md
  │
  ├─ Phase 2 (契约) ─── 🔒 → link-coder.md             8 组 rule+skill
```

替换为：

```
  ├─ Phase 1 (设计) ─── 🔒 → system-design-coder.md   架构设计 + 详细设计
  │                    🔒 → prototype-coder.md         高保真原型
  │     📎 产出: architecture.md, detailed-design.md, schema.sql,
  │             prototype/index.html, mock.js, tokens.css, blueprint.md
  │     ⚠️ 原型已存在时跳过本 Phase（startPhase ≥ 1.5）
  │
  ├─ Phase 1.5 (反推) ─ 🔒 → prototype-to-model.md    双原型交叉验证
  │     📎 输入: admin 原型 + miniapp 原型
  │     📎 产出: data-model.md, pending-decisions.md, schema.sql
  │     ⚠️ 无 PRD 场景下的数据模型唯一来源
  │
  ├─ Phase 2 (契约) ─── 🔒 → link-coder.md             8 组 rule+skill
```

同时把该代码块上方的标题 `### 绑定关系链（6-Phase 拓扑）` 改为 `### 绑定关系链（7-Phase 拓扑）`，并把文件开头介绍段（第 3 行）中的 `通过 6 阶段编排` 改为 `通过 7 阶段编排`。

**还有一处 `6-Phase` 必须一并改** —— 本节之外，文件下半部有一个章节标题 `## 6-Phase 工作流`（该章节内含完整流程图）。改为：

```
## 7-Phase 工作流
```

> 该章节的流程图内容由 Task 5 插入 Phase 1.5 段落，本步只改标题文字。

- [ ] **Step 2: 在编排表中新增 Phase 1.5 行**

找到 `## 可用端级智能体` 下的表格，在 `| 3 | Link Contract |` 行之前插入：

```
| 2.5★ | Prototype→Model | [prototype-to-model.md](prototype-to-model.md) | 1.5 | 检测到两份原型（startPhase ≤ 1.5） |
```

> 注：此表 `#` 列是历史编号，不必连续；`2.5★` 表示插在 2 与 3 之间的新环节。

- [ ] **Step 3: 修改 Frontend / MiniProgram 两行的 Phase 列**

将该表中的这两行：

```
| 6 | Frontend | [frontend-coder.md](frontend-coder.md) | 3 | Phase 0 检测到前端项目 |
| 7 | MiniProgram | [mini-program-coder.md](mini-program-coder.md) | 3 | Phase 0 检测到小程序页面 / 微信功能 |
```

替换为：

```
| 6 | Frontend | [frontend-coder.md](frontend-coder.md) | 3 | targets.frontend.enabled。含 CONVERT（html-to-admin）+ 接后端两步 |
| 7 | MiniProgram | [mini-program-coder.md](mini-program-coder.md) | 3 | targets.miniProgram.enabled。含 CONVERT（html-to-miniapp）+ 接后端两步 |
```

> **注意**：此处触发条件从「Phase 0 检测到」改为 `targets.*.enabled`，与 Task 3 的 targets 二元结构对齐。

- [ ] **Step 4: 验证**

Run:
```bash
grep -n "Phase 1.5" agents/flow-orchestrator.md | head -5 && \
grep -n "prototype-to-model" agents/flow-orchestrator.md && \
grep -c "7-Phase 拓扑" agents/flow-orchestrator.md
```
Expected:
- `Phase 1.5` 至少 2 处（拓扑图 + 编排表）
- `prototype-to-model` 至少 2 处（拓扑图 + 编排表链接）
- `7-Phase 拓扑` 输出 `1`

- [ ] **Step 5: 验证无残留旧标题**

Run:
```bash
grep -n "6-Phase" agents/flow-orchestrator.md
```
Expected: 无输出（退出码 1）

> 该断言覆盖**两处**：`### 绑定关系链（6-Phase 拓扑）` 与 `## 6-Phase 工作流`。只改前者会让这条断言失败。

- [ ] **Step 6: 提交**

```bash
git add agents/flow-orchestrator.md
git commit -m "feat(flow-orchestrator): insert Phase 1.5 into topology and agent table

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: flow-orchestrator — Phase 0 检测改造与 targets 二元结构

**Files:**
- Modify: `agents/flow-orchestrator.md`

**Interfaces:**
- Consumes: Task 2 已改好的编排表（本任务把表格里引用的 `targets.*.enabled` 真正定义出来）
- Produces: `targets.<end>.{enabled, mode, detected, dirName}` 结构；Phase 0 产物检测表新增「数据模型」「待确认项」两行并修正「高保真原型」行的用途列。Task 4 的校验块引用 `targets 已确认`。

- [ ] **Step 1: 修改产物检测表中的「高保真原型」行并新增两行**

找到 `### 文档产物检测` 下的表格，将该行：

```
| 高保真原型 | `prototype/` 目录或文件名含 `prototype` | Phase 1 产出 / Phase 3 输入 |
```

替换为：

```
| 高保真原型 | `prototype/` 目录或文件名含 `prototype` | **Phase 1 产出 / Phase 1.5 输入** |
| 数据模型 | 文件名含 `data-model` | Phase 1.5 产出 / Phase 2 输入 |
| 待确认项 | 文件名含 `pending-decisions` | Phase 1.5 产出 / 门禁 #1 输入 |
```

- [ ] **Step 2: 替换 targets 配置块**

找到 `## 项目参数（工作前必须确认）` 的 YAML 块中的：

```yaml
targets:                              # 由 Phase 0 自动检测填充
  backend: true
  frontend: true
  miniProgram: false
```

替换为：

```yaml
targets:                              # Phase 0 检测 + 用户确认后填充
  backend:
    enabled: true
    mode: "generate"                  # generate(新建) / enhance(已有项目上改)
    detected: false                   # Phase 0 是否扫到已有项目目录
    dirName: "vitrine-server"         # mode=generate 时由用户提供
  frontend:
    enabled: true
    mode: "generate"
    detected: false
    dirName: "vitrine-admin"
  miniProgram:
    enabled: true
    mode: "generate"
    detected: false
    dirName: "vitrine-miniapp"
```

- [ ] **Step 3: 在 Phase 0 检测规则中补充「待生成」判定**

找到 `### 内容驱动的项目检测` 下方的表格，在表格之后追加说明段：

```
**检测结果的两种语义：**

```
目录下含 pom.xml        → backend: mode=enhance, detected=true   （已有项目，在原有基础上改）
目录不存在 / 无 pom.xml → backend: mode=generate, detected=false  （待生成，需询问目录名）
```

> **⚠️ 关键**：`mode=generate` 时 Phase 0 **必须**询问用户「待生成的 {端} 项目目录名是什么？」，不得因检测不到而将 `enabled` 置为 `false`。同理适用于 frontend（`package.json`）与 miniProgram（`manifest.json` / `pages.json`）。
```

- [ ] **Step 4: 在起始 Phase 推荐逻辑表中新增三行**

找到 `### 起始 Phase 推荐逻辑` 下的表格，在 `| 无 PRD | 引导创建 PRD | ... |` 行之后插入：

```
| **有原型、无 PRD** | **1.5** | 原型驱动：反推数据模型 → 契约 → 编码 |
| 有原型 + 数据模型 | 2 | 跳过反推，直接生成契约 |
| 有原型 + 数据模型 + 契约 | 2.5 | 跳过反推与契约，只建库 + 编码 |
```

- [ ] **Step 5: 在项目状态面板中补充原型与数据模型行**

找到 `### 项目状态面板输出` 的 ASCII 面板，在该段：

```
│    ❌ prototype/               (待 Phase 1 生成)      │
│    ❌ api-contract.md          (待 Phase 2 生成)      │
```

替换为：

```
│    ✅ prototype/admin.html     (已有原型 · 输入)      │
│    ✅ prototype/miniapp.html   (已有原型 · 输入)      │
│    ❌ data-model.md            (待 Phase 1.5 生成)   │
│    ❌ pending-decisions.md     (待 Phase 1.5 生成)   │
│    ❌ api-contract.md          (待 Phase 2 生成)      │
```

- [ ] **Step 6: 验证**

Run:
```bash
grep -c "mode: \"generate\"" agents/flow-orchestrator.md && \
grep -n "Phase 1.5 输入" agents/flow-orchestrator.md && \
grep -n "待生成的 {端} 项目目录名" agents/flow-orchestrator.md && \
grep -c "有原型、无 PRD" agents/flow-orchestrator.md
```
Expected:
- 第一个 ≥ 3（三端各一个 mode）
- 第二个有输出（产物检测表）
- 第三个有输出（检测语义说明）
- 第四个 `1`

- [ ] **Step 7: 提交**

```bash
git add agents/flow-orchestrator.md
git commit -m "feat(flow-orchestrator): Phase 0 detects prototypes as input, targets gains generate/enhance mode

A server directory that does not exist yet can no longer silently
disable backend-coder: mode=generate is asked for rather than inferred
from a missing pom.xml.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: flow-orchestrator — startPhase 1.5 档位与校验块重写

**Files:**
- Modify: `agents/flow-orchestrator.md`

**Interfaces:**
- Consumes: Task 3 定义的 `targets` 结构
- Produces: `startPhase: 1.5` 档位；重写后的产物匹配校验块；`externalInputs` 新增三个字段。Task 5 的 Phase 1.5 调度章节假定 1.5 档位存在。

- [ ] **Step 1: 在典型场景表中插入 1.5 档位**

找到 `### 典型场景` 下的表格，在 `| 2 | Phase 0-1 | ... |` 行之后插入：

```
| **1.5** | Phase 0-1 | `prototypeAdmin` + `prototypeMiniApp` | 原型已有，无 PRD，反推数据模型 |
```

- [ ] **Step 2: 重写产物匹配校验块**

找到 `### 产物匹配校验` 下的代码块，整体替换为：

```
startPhase >= 1   : project.rootPath 非空
startPhase >= 1.5 : externalInputs.prototypeAdmin + prototypeMiniApp 非空且文件存在
startPhase >= 2   : externalInputs.dataModel 非空 + 文件存在
startPhase >= 2.5 : externalInputs.linkContract 非空 + 文件存在
startPhase >= 2.5 : 数据库已就绪（Phase 2.5 已完成 或 schema.sql 可执行）
startPhase >= 3   : targets 已确认（各端 mode / dirName 齐全）
startPhase >= 4   : 项目目录存在（代码已生成）
```

> **修正说明**：原校验块中 `linkContract` 门槛为 `>= 3`，导致 `startPhase=2.5` 会在空契约下进入建库与编码；原 `schemaSql` 门槛同为 `>= 3`，而 2.5 档位本身即需要 schema.sql。新块将两者门槛提到 `>= 2.5`。

- [ ] **Step 3: 扩展 externalInputs**

找到 YAML 块中的：

```yaml
externalInputs:                       # 跳过的 Phase 产物须由外部提供
  systemDesign: ""                    # Phase 1 产物：架构设计+详细设计文档路径
  prototype: ""                       # Phase 1 产物：高保真原型路径
  linkContract: ""                    # Phase 2 产物：API 契约文档路径
  schemaSql: ""                       # Phase 2.5 输入：数据库 DDL 路径
```

替换为：

```yaml
externalInputs:                       # 跳过的 Phase 产物须由外部提供
  prototypeAdmin: ""                  # ★ Phase 1.5 输入：admin 高保真原型路径
  prototypeMiniApp: ""                # ★ Phase 1.5 输入：miniapp 高保真原型路径
  dataModel: ""                       # ★ Phase 1.5 产物：数据模型文档路径
  systemDesign: ""                    # Phase 1 产物：架构设计+详细设计文档路径
  linkContract: ""                    # Phase 2 产物：API 契约文档路径
  schemaSql: ""                       # Phase 2.5 输入：数据库 DDL 路径
```

- [ ] **Step 4: 更新执行规则中的 Phase 范围提示**

找到 `### 执行规则` 代码块中的：

```
2. startPhase 未填写 → 询问用户："从哪个 Phase 开始？（0-5，默认 0）"
```

替换为：

```
2. startPhase 未填写 → 询问用户："从哪个 Phase 开始？（0 / 1 / 1.5 / 2 / 2.5 / 3 / 4 / 5，默认 0）"
```

- [ ] **Step 5: 验证**

Run:
```bash
grep -n "startPhase >= 1.5" agents/flow-orchestrator.md && \
grep -n "startPhase >= 2.5 : externalInputs.linkContract" agents/flow-orchestrator.md && \
grep -c "prototypeAdmin" agents/flow-orchestrator.md && \
grep -n "0 / 1 / 1.5 / 2 / 2.5 / 3 / 4 / 5" agents/flow-orchestrator.md
```
Expected: 四组均有输出，`prototypeAdmin` 计数 ≥ 3（YAML + 校验块 + 典型场景表）

- [ ] **Step 6: 验证旧的错误门槛已消失**

Run:
```bash
grep -n "startPhase >= 3 : externalInputs.linkContract" agents/flow-orchestrator.md
```
Expected: 无输出（退出码 1）

- [ ] **Step 7: 提交**

```bash
git add agents/flow-orchestrator.md
git commit -m "feat(flow-orchestrator): add startPhase 1.5 tier, fix artifact validation thresholds

linkContract and schemaSql were gated at >= 3 while startPhase=2.5
skips Phase 2 and consumes schema.sql — the tier could enter DB init
with an empty contract. Both thresholds move to >= 2.5.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: flow-orchestrator — Phase 1.5 调度章节与门禁 #1 扩展

**Files:**
- Modify: `agents/flow-orchestrator.md`

**Interfaces:**
- Consumes: Task 1 的 agent 协议、Task 2 的拓扑位置、Task 4 的 1.5 档位
- Produces: Phase 1.5 的调度说明段；门禁 #1 的两组新审核块（数据模型审核 + 业务语义确认）及其触发条件表。

- [ ] **Step 1: 在 PRE-FLIGHT 例外说明中追加 Phase 1.5**

找到 `> **Phase 2.5 agent 例外：**` 那一行，在其后另起一行追加：

```
> **Phase 1.5 agent 例外：** prototype-to-model 不经过 PRE-FLIGHT。其 rule/skill 目录不存在，调度指令直接包含两份原型路径 + 产品基本信息，按自身协议执行 RECEIVE → PARSE → CROSS → EXTRACT → DERIVE → GAP → VERIFY → REPORT。
```

- [ ] **Step 2: 在 6-Phase 工作流图中插入 Phase 1.5 段落**

找到：

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  startPhase > 2 ? 跳过 Phase 2，读 externalInputs.linkContract
  作为 Phase 3 编码基准
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

在其**之前**插入：

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  startPhase > 1.5 ? 跳过 Phase 1.5，读 externalInputs.dataModel
  作为 Phase 2 契约的输入
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
┌──────────────────────────────────────────────────────────────────────┐
│ PHASE 1.5: 原型反推数据模型（★ 新增）                                   │
│                                                                        │
│  prototype-to-model 读两份原型，交叉验证:                               │
│  1. PARSE  分别解析 admin / miniapp 原型（表格列头+表单控件+mock 数据）  │
│  2. CROSS  同一字段两端比对 → 锁定类型（覆盖率必须统计）                  │
│  3. EXTRACT 实体 / 字段 / 关系 / 接口 / 状态机 / 角色权限                │
│  4. DERIVE  派生 schema.sql                                            │
│  5. GAP    推不出的 → pending-decisions.md（不臆造）                    │
│  6. VERIFY → REPORT <model-compliance>                                 │
│                                                                        │
│  输入: admin 原型 + miniapp 原型                                        │
│  产出: docs/data-model.md, docs/pending-decisions.md, docs/schema.sql  │
│                                                                        │
│  ⚠️ 无 PRD 场景下数据模型的唯一来源                                      │
│  ⚠️ 不经过 PRE-FLIGHT（rule/skill 不存在）                              │
└──────────────────────────────────────────────────────────────────────┘
```

- [ ] **Step 3: 在门禁 #1 中追加两组审核块**

找到门禁 #1 方框中的：

```
│  Prototype 审核:                                                        │
│  □ 原型是否覆盖 Spec 中所有功能页面？                                     │
│  □ 每个页面是否包含四态？（loading/error/empty/normal）                   │
│  □ 可交互组件是否覆盖完整状态矩阵？                                       │
│  □ 色彩对比度是否满足 WCAG AA？                                          │
│  □ 图标按钮是否有 aria-label？ Modal 是否有 role="dialog"？              │
│                                                                         │
│  全部确认 → 进入 Phase 2 | 有问题 → 返回 Phase 1 修复                    │
└────────────────────────────────────────────────────────────────────────┘
```

替换为：

```
│  Prototype 审核（仅走 Phase 1 时适用）:                                  │
│  □ 原型是否覆盖 Spec 中所有功能页面？                                     │
│  □ 每个页面是否包含四态？（loading/error/empty/normal）                   │
│  □ 可交互组件是否覆盖完整状态矩阵？                                       │
│  □ 色彩对比度是否满足 WCAG AA？                                          │
│  □ 图标按钮是否有 aria-label？ Modal 是否有 role="dialog"？              │
│                                                                         │
│  ★ 数据模型审核（走 Phase 1.5 或数据模型首次引入时必过）:                  │
│  □ 实体是否覆盖两份原型的全部页面数据需求？                                │
│  □ 每个实体的字段是否与原型表格列/表单字段一一对应？                        │
│  □ 字段类型是否经过两端交叉验证（而非单端推断）？                           │
│  □ 关系与基数是否正确？（一对多 vs 多对多）                                │
│  □ 交叉验证覆盖率是否可接受？（低于 60% 需说明）                           │
│  □ 审计列是否已标注适用实体？                                             │
│                                                                         │
│  ★ 业务语义确认（同上，必过）:                                            │
│  逐条确认 pending-decisions.md:                                          │
│    | # | 项 | 候选值 | 默认建议 | 你的选择 |                              │
│  全部确认 → 进入 Phase 2 | 有修正 → 更新 data-model.md 后重新确认          │
│  ⚠️ 存在「状态 = 待确认」的项时，禁止进入 Phase 2                          │
│                                                                         │
│  全部确认 → 进入 Phase 2 | 有问题 → 返回 Phase 1 / 1.5 修复              │
└────────────────────────────────────────────────────────────────────────┘
```

- [ ] **Step 4: 在门禁 #1 之后追加触发条件说明**

紧接上述方框代码块之后，追加：

```
> **门禁 #1 触发条件：**

| 情形 | 数据模型审核 + 业务语义确认 | SystemDesign / Prototype 审核 |
|---|---|---|
| startPhase ≤ 1（原型由 Phase 1 生成） | ✅ 必过 | ✅ 必过 |
| startPhase = 1.5（数据模型由 Phase 1.5 反推） | ✅ 必过 | ❌ 不适用 |
| startPhase = 2（数据模型由外部提供） | ✅ 必过 | ❌ 不适用 |
| startPhase ≥ 2.5 | 已在前次门禁确认 | 不适用 |

> 即：**只要数据模型是本次流程新产出或首次引入的，就必须过数据模型审核 + 业务语义确认**；只有此前已过门禁的产物才可复用而不重复确认。
```

- [ ] **Step 5: 验证**

Run:
```bash
grep -n "PHASE 1.5: 原型反推数据模型" agents/flow-orchestrator.md && \
grep -n "数据模型审核" agents/flow-orchestrator.md && \
grep -n "业务语义确认" agents/flow-orchestrator.md && \
grep -n "门禁 #1 触发条件" agents/flow-orchestrator.md && \
grep -n "Phase 1.5 agent 例外" agents/flow-orchestrator.md
```
Expected: 五组均有输出

- [ ] **Step 6: 提交**

```bash
git add agents/flow-orchestrator.md
git commit -m "feat(flow-orchestrator): add Phase 1.5 dispatch section and extend gate #1

Gate #1 gains data-model review and business-semantics confirmation.
Phase 2 is blocked while any pending-decision is still unconfirmed.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: flow-orchestrator — 产物落盘约定、Phase 3 协议与禁止项

**Files:**
- Modify: `agents/flow-orchestrator.md`

**Interfaces:**
- Consumes: Task 2/3/4/5 的全部前置改动
- Produces: 落盘路径约定章节；POST-FLIGHT 中的路径核对项；Phase 3 方框的两步走描述；4 条新禁止项。

- [ ] **Step 1: 新增产物落盘约定章节**

在 `## Phase 0: 项目发现 + 状态评估` 标题**之前**插入：

```
## 产物落盘约定

> 所有端级 agent 的产出**必须**落盘，不得仅在对话中返回。子代理上下文隔离，不落盘无法交接。

统一落盘根路径：`{project.rootPath}/docs/`

```
{project.rootPath}/
  ├── docs/
  │   ├── data-model.md           Phase 1.5 产出
  │   ├── pending-decisions.md    Phase 1.5 产出
  │   ├── schema.sql              Phase 1.5 产出
  │   ├── api-contract.md         Phase 2 产出
  │   ├── prototype/              Phase 1 产出（走完整流程时）
  │   └── reports/
  │       ├── db-execution.md     Phase 2.5 产出
  │       ├── compliance-{end}.md Phase 3 产出
  │       └── integration.md      Phase 4 产出
  ├── {backend dir}/
  ├── {frontend dir}/
  └── {miniProgram dir}/
```

**规则：** flow-orchestrator 在 POST-FLIGHT 中按上述路径读取产物核对，路径不存在即判 FAIL。

---

```

- [ ] **Step 2: 在 POST-FLIGHT 中追加路径核对与 Phase 1.5 报告解析**

找到 POST-FLIGHT 代码块中的：

```
1. 解析端级 agent 输出:
   - Phase 1/3 agent 输出 <binding-compliance> 标记
   - Phase 2 link-coder 输出 <contract-compliance> 标记
```

替换为：

```
1. 解析端级 agent 输出:
   - Phase 1/3 agent 输出 <binding-compliance> 标记
   - Phase 1.5 prototype-to-model 输出 <model-compliance> 标记
   - Phase 2 link-coder 输出 <contract-compliance> 标记
```

并找到该代码块中的 Phase 3 额外检查项：

```
4. Phase 3 agent 额外检查:
   - Link 契约一致性（URL/Method/字段/分页/Token）
   - 后端自启校验结果（API 测试通过 / 数据落库正确 / 端口已清理）
   - 前端 mock 清理状态（mock 已清除 / baseUrl 已指向真实后端）
```

替换为：

```
4. Phase 3 agent 额外检查:
   - Link 契约一致性（URL/Method/字段/分页/Token）
   - 后端自启校验结果（API 测试通过 / 数据落库正确 / 端口已清理）
   - 前端/小程序 CONVERT 产物是否来自 html-to-*（而非手工编写页面）
   - 转换期 mock（utils/mock.ts / utils/mock.js）在 WIRE 后是否已无残留引用
   - 全部 mock 是否已清除 / baseUrl 是否已指向真实后端
```

并在该代码块末尾（`6. 发现违规 → ...` 之后）追加：

```
7. 核对产物落盘:
   - 按「产物落盘约定」逐路径确认文件存在且非空
   - Phase 1.5 → docs/data-model.md / pending-decisions.md / schema.sql
   - Phase 2   → docs/api-contract.md
   - 路径缺失或为空 → 判 FAIL
8. 核对待确认项留痕:
   - data-model.md 中置信度为 LOW 的字段，在生成代码中是否有 // TODO(decision-#N) 注释
   - 缺失留痕 → 判 FAIL
```

- [ ] **Step 3: 修改 Phase 3 方框，标注两步走**

找到 `PHASE 3: 并行编码` 方框中的：

```
│  │ Backend Coder   │  │ Frontend Coder  │  │MiniProgram Coder│         │
│  │ 18 维度 rule+   │  │ 19 维度 rule+   │  │ 13+16 维度      │         │
│  │ skill           │  │ skill           │  │ rule+skill      │         │
│  │                 │  │                 │  │                 │         │
│  │ PRE-FLIGHT      │  │ PRE-FLIGHT      │  │ PRE-FLIGHT      │         │
│  │ → EXECUTE       │  │ → EXECUTE       │  │ → EXECUTE       │         │
│  │ → BUILD (mvn)   │  │ → BUILD (npm)   │  │ → BUILD (cli)   │         │
│  │ → MOCK (N/A)    │  │ → MOCK (契约mock)│  │                 │         │
│  │ → SELF-TEST     │  │ → SELF-TEST     │  │ → CONTRACT      │         │
│  │   (逐API+落库)   │  │   (页面四态+交互)│  │                 │         │
│  │ → CLEANUP       │  │ → CLEANUP       │  │ → POST-FLIGHT   │         │
│  │   (kill端口)     │  │   (去mock+回指)  │  │                 │         │
│  │ → POST-FLIGHT   │  │ → POST-FLIGHT   │  │ → POST-FLIGHT   │         │
│  └────────────────┘  └────────────────┘  └────────────────┘          │
```

替换为：

```
│  │ Backend Coder   │  │ Frontend Coder  │  │MiniProgram Coder│         │
│  │ 18 维度 rule+   │  │ 19 维度 rule+   │  │ 13+16 维度      │         │
│  │ skill           │  │ skill           │  │ rule+skill      │         │
│  │                 │  │                 │  │                 │         │
│  │ PRE-FLIGHT      │  │ PRE-FLIGHT      │  │ PRE-FLIGHT      │         │
│  │ → EXECUTE       │  │ → CONVERT ★     │  │ → CONVERT ★     │         │
│  │   (契约驱动)     │  │   (html-to-admin)│  │ (html-to-miniapp)│        │
│  │ → BUILD (mvn)   │  │ → WIRE ★        │  │ → WIRE ★        │         │
│  │ → SELF-TEST     │  │   (契约API层     │  │   (契约API层     │         │
│  │   (逐API+落库)   │  │    覆盖mock)     │  │    覆盖mock)     │         │
│  │ → CLEANUP       │  │ → BUILD (npm)   │  │ → BUILD (cli)   │         │
│  │   (kill端口)     │  │ → SELF-TEST     │  │ → CONTRACT      │         │
│  │ → POST-FLIGHT   │  │   (页面四态+交互)│  │                 │         │
│  │                 │  │ → CLEANUP       │  │ → POST-FLIGHT   │         │
│  │                 │  │   (去mock+回指)  │  │                 │         │
│  │                 │  │ → POST-FLIGHT   │  │                 │         │
│  └────────────────┘  └────────────────┘  └────────────────┘          │
```

并在该方框的 `⚠️` 说明段中追加一行：

```
│  ⚠️ 前端/小程序端为两步走：CONVERT（html-to-* 转换骨架）→ WIRE（契约 API 层覆盖转换期 mock）│
```

- [ ] **Step 4: 追加禁止项**

找到 `## 禁止事项（根级）` 列表末尾的：

```
- ❌ **在最终报告中报告 SUCCESS 但存在 BLOCKER 级 FAIL 项**
```

在其后追加：

```
- ❌ **Phase 1.5 未产出 data-model.md 即进入 Phase 2**
- ❌ **pending-decisions.md 存在「状态 = 待确认」项时进入 Phase 2**
- ❌ **字段标注为 LOW 置信度却在代码中静默采用默认值而不留 TODO 注释**
- ❌ **跳过产物落盘（产出仅在对话中返回，未写入 docs/）**
```

- [ ] **Step 5: 验证**

Run:
```bash
grep -n "## 产物落盘约定" agents/flow-orchestrator.md && \
grep -n "model-compliance" agents/flow-orchestrator.md && \
grep -n "CONVERT ★" agents/flow-orchestrator.md && \
grep -c "Phase 1.5 未产出 data-model.md" agents/flow-orchestrator.md && \
grep -n "核对产物落盘" agents/flow-orchestrator.md
```
Expected: 五组均有输出

- [ ] **Step 6: 提交**

```bash
git add agents/flow-orchestrator.md
git commit -m "feat(flow-orchestrator): define artifact write paths, two-step Phase 3, new prohibitions

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: link-coder — DERIVE 数据源切换

**Files:**
- Modify: `agents/link-coder.md`

**Interfaces:**
- Consumes: Task 1 定义的 `data-model.md` 结构（第 2 节字段表的列：字段 / 类型 / 长度 / 可空 / 唯一 / 默认值 / 枚举 / 注释 / 来源证据 / 置信度）
- Produces: DERIVE 步骤改读 `data-model.md`。无后续任务依赖。

- [ ] **Step 1: 替换 DERIVE 步骤的数据源**

找到执行协议中的：

```
3. DERIVE   ★ 读取 Phase 1 产出的 detailed-design.md → 提取数据库字段类型
            → 对每个业务实体，提取：字段名/DB类型/长度/是否可空/默认值/注释
            → 将 DB 字段映射到对应的 API Request/Response 字段
            → 按类型推导规则生成精确的示例值（非随意占位符）
```

替换为：

```
3. DERIVE   ★ 读取 Phase 1.5 产出的 docs/data-model.md → 提取实体字段定义
            → 读取第 2 节「实体字段定义」，逐实体提取：
              字段名 / DB类型 / 长度 / 是否可空 / 唯一 / 默认值 / 枚举 / 注释 / 来源证据 / 置信度
            → 将 DB 字段映射到对应的 API Request/Response 字段
            → 按类型推导规则生成精确的示例值（非随意占位符）
            ⚠️ 置信度为 LOW 的字段：在契约中标注「需确认」，不得默认为确定值
```

> **列名对齐**：`来源证据` 是 data-model.md 第 2 节的列之一（由 Phase 1.5 的 prototype-to-model 产出），DERIVE 必须读取它 —— 契约的「来源」列直接引用该值。

- [ ] **Step 2: 更新 DERIVE 步骤详解的输入示例**

找到 `### DERIVE 步骤详解` 中的：

```
步骤 3.1: 读取 detailed-design.md
          → 定位「数据库表设计」或「数据模型」章节
```

替换为：

```
步骤 3.1: 读取 docs/data-model.md
          → 定位第 2 节「实体字段定义」
```

并把该段中的示例输入标题：

```
          示例输入（detailed-design.md 原文）：
```

替换为：

```
          示例输入（data-model.md 第 2.1 节原文）：
```

**再替换示例值推导规则的引言**（位于 `### 示例值推导规则` 一节）：找到：

```
> 示例值来源于 detailed-design.md 中的数据库字段类型，不可随意填充。推导规则如下：
```

替换为：

```
> 示例值来源于 docs/data-model.md 中的实体字段类型，不可随意填充。推导规则如下：
```

- [ ] **Step 3: 更新自检清单**

找到合规自检清单中的：

```
2. □ 是否已执行 DERIVE 步骤：读取 detailed-design.md 并提取 DB 字段类型？
```

替换为：

```
2. □ 是否已执行 DERIVE 步骤：读取 docs/data-model.md 并提取实体字段类型？
```

并在清单末尾追加两条：

```
14. □ 契约中字段的「来源」列是否引用了 data-model.md 的具体字段行？
15. □ data-model.md 中标注为 LOW 置信度的字段，是否在契约中标注「需确认」？
```

- [ ] **Step 4: 验证**

Run:
```bash
grep -c "data-model.md" agents/link-coder.md && \
grep -n "需确认" agents/link-coder.md | head -3 && \
grep -c "^15\. □" agents/link-coder.md
```
Expected:
- 第一个 ≥ 4（DERIVE 步骤 + 详解 + 自检 + 新增自检）
- 第二个有输出
- 第三个 `1`

- [ ] **Step 5: 验证旧数据源已清除**

Run:
```bash
grep -n "detailed-design" agents/link-coder.md
```
Expected: 无输出（退出码 1）

> 若仍有输出，逐一确认残留处是否确实应改为 `data-model.md`。

- [ ] **Step 6: 提交**

```bash
git add agents/link-coder.md
git commit -m "refactor(link-coder): DERIVE reads data-model.md instead of detailed-design.md

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: frontend-coder 与 mini-program-coder — 两步走协议

**Files:**
- Modify: `agents/frontend-coder.md`
- Modify: `agents/mini-program-coder.md`

**Interfaces:**
- Consumes: Task 6 定义的 Phase 3 两步走模型、Task 4 的 `targets` 结构
- Produces: 两个 coder agent 的 CONVERT 步骤与 mock 存活期裁决。无后续任务依赖。

> **说明**：两个文件的改动是同构的（同一协议套用到两个端）。此处合并为一个任务 —— 审阅者对两者的接受/拒绝必然一致。

- [ ] **Step 1: 修改 frontend-coder 的 CONVERT 与 WIRE 步骤**

在 `agents/frontend-coder.md` 的执行协议代码块中，找到：

```
6. VERIFY  对照 rule 逐条自检 → PASS 则输出，FAIL 则修复后重检（最多 3 轮）
7. BUILD   使用指定 Node 版本执行构建
```

替换为：

```
6. CONVERT ★ 调用 html-to-admin 技能，从原型转换页面骨架：
   a. 输入：Phase 0 检测到的 admin 高保真原型路径
   b. 执行 skills/frontend/html-to-admin/SKILL.md 的转换流程
   c. 产出：页面 / 布局 / 路由 / 交互 + 转换期 mock（utils/mock.ts）
   d. 范围限定：本步骤只做 UI 骨架转换，**不实现 API 请求**
7. VERIFY  对照 rule 逐条自检 → PASS 则输出，FAIL 则修复后重检（最多 3 轮）
8. WIRE ★  按 Link 契约生成 API 层，**完全覆盖转换期 mock**：
   a. 依据契约的 URL/Method/Request/Response 生成 api/ 模块
   b. 将页面数据源从 utils/mock.ts 切换到真实 API 调用
   c. 确认 utils/mock.ts 中不再被任何页面引用
```

然后把**原有的**后续步骤重新编号（原 7→9、8→10、9→11、10→12、11→13、12→14）：

```
9. BUILD   使用指定 Node 版本执行构建
10. MOCK   基于 Link 契约生成 mock 假数据（自测用）
11. START  启动 dev server
12. SELF-TEST 逐页面自测验证
13. CLEANUP 清理 mock 环境
14. REPORT 输出 <binding-compliance> 标记（含 mock 自测结果）
```

> **命名说明**：新步骤命名为 `WIRE`（接线）而非 `EXECUTE` —— 原第 5 步已是 `EXECUTE`（按 rule+skill 生成业务代码），重名会让后续编辑与审阅产生歧义。

- [ ] **Step 2: 修改 frontend-coder 的 CLEANUP 步骤**

找到：

```
13. CLEANUP 清理 mock 环境：
    a. kill 前端端口进程
```

替换为：

```
13. CLEANUP 清理 mock 环境：
    a. 确认转换期 mock（utils/mock.ts）已完全移除，无残留引用
    b. kill 前端端口进程
```

- [ ] **Step 3: 修改 frontend-coder 的自检清单**

找到自检清单中的：

```
15. □ mock 数据是否基于 Link 契约生成（字段名/类型/结构与契约精确对齐）？
16. □ mock 自测后前端端口是否已清理（确认进程已终止）？
17. □ mock 数据是否已清除？API baseUrl 是否已指向真实后端地址（不再指向 mock server）？
```

替换为：

```
15. □ CONVERT 步骤是否已调用 html-to-admin（而非手工编写页面）？
16. □ 转换期 mock 是否已被 API 层完全覆盖（utils/mock.ts 无残留引用）？
17. □ 自测 mock 是否基于 Link 契约生成（字段名/类型/结构与契约精确对齐）？
18. □ mock 自测后前端端口是否已清理（确认进程已终止）？
19. □ 所有 mock 是否已清除？API baseUrl 是否已指向真实后端地址？
```

- [ ] **Step 4: 对 mini-program-coder 施加同构改动**

**4a.** 在 `agents/mini-program-coder.md` 的执行协议代码块中，找到：

```
6. VERIFY  对照 rule 逐条自检 → PASS 则输出，FAIL 则修复后重检（最多 3 轮）
7. BUILD   执行对应框架的编译命令（无编译错误则 PASS）
8. CONTRACT 基于 Link 契约校验:
```

替换为：

```
6. CONVERT ★ 调用 html-to-miniapp 技能，从原型转换页面骨架：
   a. 输入：Phase 0 检测到的 miniapp 高保真原型路径
   b. 执行 skills/miniProgram/html-to-miniapp/SKILL.md 的转换流程
   c. 产出：页面 / TabBar / 路由 / 交互 + 转换期 mock（utils/mock.js）
   d. 范围限定：本步骤只做 UI 骨架转换，**不实现网络请求**
7. VERIFY  对照 rule 逐条自检 → PASS 则输出，FAIL 则修复后重检（最多 3 轮）
8. WIRE ★  按 Link 契约生成请求层，**完全覆盖转换期 mock**：
   a. 依据契约的 URL/Method/Request/Response 生成 api/ 模块
   b. 将页面数据源从 utils/mock.js 切换到真实请求调用
   c. 确认 utils/mock.js 中不再被任何页面引用
9. BUILD   执行对应框架的编译命令（无编译错误则 PASS）
10. CONTRACT 基于 Link 契约校验:
```

> **注意**：mini-program-coder 的协议结构与 frontend-coder **不同** —— 它只有 9 步，且无 MOCK / START / SELF-TEST / CLEANUP 步骤。本步只把原 `8. CONTRACT` 改为 `10. CONTRACT`，**不要**照搬 Step 1 的编号偏移。

**4b.** mini-program-coder **没有 CLEANUP 步骤**（原协议止于 `9. REPORT`）。新增一步，插在 `CONTRACT` 与 `REPORT` 之间，并把原 `9. REPORT` 改为 `12. REPORT`：

```
11. CLEANUP 确认转换期 mock（utils/mock.js）已完全移除、无残留引用
            → 确认请求 baseUrl 已指向真实后端地址
12. REPORT  输出 <binding-compliance> 标记（含 mock 清理结果）
```

**最终编号**：`6. CONVERT` / `7. VERIFY` / `8. WIRE` / `9. BUILD` / `10. CONTRACT` / `11. CLEANUP` / `12. REPORT`。

**4c.** 在 mini-program-coder 的合规自检清单末尾追加：

```
15. □ CONVERT 步骤是否已调用 html-to-miniapp（而非手工编写页面）？
16. □ 转换期 mock 是否已被请求层完全覆盖（utils/mock.js 无残留引用）？
17. □ 自测 mock 是否基于 Link 契约生成（字段名/类型/结构与契约精确对齐）？
18. □ 所有 mock 是否已清除？请求 baseUrl 是否已指向真实后端地址？
```

- [ ] **Step 5: 验证 frontend-coder**

Run:
```bash
grep -n "6. CONVERT" agents/frontend-coder.md && \
grep -n "8. WIRE" agents/frontend-coder.md && \
grep -c "html-to-admin" agents/frontend-coder.md && \
grep -c "^19\. □" agents/frontend-coder.md
```
Expected: 四组均有输出，`html-to-admin` 计数 ≥ 2，最后一个数字为 `1`

- [ ] **Step 6: 验证 mini-program-coder**

Run:
```bash
grep -n "8. WIRE" agents/mini-program-coder.md && \
grep -n "11. CLEANUP" agents/mini-program-coder.md && \
grep -n "utils/mock.js" agents/mini-program-coder.md | head -3 && \
grep -c "^18\. □" agents/mini-program-coder.md
```
Expected: 四组均有输出，最后一个数字为 `1`

> **若 `11. CLEANUP` 无输出**：说明 4b 的插入位置有误，回到 Step 4b 检查 CONTRACT 与 REPORT 之间是否已插入。

- [ ] **Step 7: 验证步骤编号连续无重复**

Run（只取 `## 执行协议` 之后的那个代码块，避免误收自检清单的编号）：
```bash
sed -n '/^## 执行协议/,/^```$/p' agents/frontend-coder.md | grep -oE "^[0-9]+\."
```
Expected: 输出为 `1. 2. 3. 4. 5. 6. 7. 8. 9. 10. 11. 12. 13. 14.`，连续无重复、无跳号

对 mini-program-coder 同样执行：
```bash
sed -n '/^## 执行协议/,/^```$/p' agents/mini-program-coder.md | grep -oE "^[0-9]+\."
```
Expected: `1. 2. 3. 4. 5. 6. 7. 8. 9. 10. 11. 12.`

- [ ] **Step 8: 提交**

```bash
git add agents/frontend-coder.md agents/mini-program-coder.md
git commit -m "feat(coders): two-step frontend/miniapp protocol — convert skeleton, then contract API layer

html-to-* conversion mock and self-test mock now have distinct
lifetimes: conversion mock lives until EXECUTE overwrites it, self-test
mock until CLEANUP. The 'no backend logic' constraint of the conversion
skills is scoped to CONVERT only.

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## 附录：任务依赖图

```
Task 1 (new agent) ──┬──→ Task 2 (topology) ──→ Task 3 (Phase 0) ──→ Task 4 (startPhase) ──→ Task 5 (Phase 1.5 + gate) ──→ Task 6 (paths + Phase 3)
                     │                                                                                                    │
                     └──────────────────────────────────────→ Task 7 (link-coder DERIVE)                                    │
                                                                                                                          ▼
                                                                                                     Task 8 (coders two-step)
```

**串行执行**（Task 2-6 都改 `flow-orchestrator.md`，不可并行）。Task 7 与 Task 8 依赖 Task 1，可在 Task 6 之前并行插入。
