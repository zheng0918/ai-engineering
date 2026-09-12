# 原型驱动三端转换 — 设计文档

> 日期：2026-09-12
> 状态：待评审
> 影响范围：[agents/flow-orchestrator.md](../../../agents/flow-orchestrator.md)、新增 agents/prototype-to-model.md、[agents/link-coder.md](../../../agents/link-coder.md)、[agents/frontend-coder.md](../../../agents/frontend-coder.md)、[agents/mini-program-coder.md](../../../agents/mini-program-coder.md)

---

## 一、背景与目标

### 场景

用户持有**同一产品的两份高保真原型**（admin 管理后台一份、miniapp 小程序一份），希望经由 flow-orchestrator 编排，产出**三端完整可跑的项目**：server（后端）、admin（管理后台）、miniapp（小程序）。

**不使用 PRD。** 两份原型是唯一的业务信息来源。

### 目标

1. flow-orchestrator 能把「已存在的原型」识别为流程输入，而非 Phase 1 的产出
2. server 端有合法的数据模型来源（当前从原型无从推导）
3. 业务语义（订单超时、库存扣减时机等）有显式的确认环节，不被静默编造
4. admin/miniapp 基于原型转换，但仍受 Link 契约约束，不与 server 劈叉

### 非目标

- 不改造 html-to-admin / html-to-miniapp 的内部流程（7 阶段 / 5 阶段保持不变）
- 不为 Phase 1（system-design-coder / prototype-coder）补建 rule/skill
- 不修复 knowledge/ 下 71 个空壳文件

---

## 二、现状缺口

对着 [flow-orchestrator.md](../../../agents/flow-orchestrator.md) 逐条核验，在「无 PRD + 原型已有」场景下存在 4 个缺失环节与 3 个逻辑漏洞。

### 缺失环节

| # | 缺口 | 证据 |
|---|---|---|
| 1 | **无原型入口** | [L328](../../../agents/flow-orchestrator.md#L328) `输入: PRD`；[L267](../../../agents/flow-orchestrator.md#L267) `无 PRD → 引导创建 PRD`；[L230](../../../agents/flow-orchestrator.md#L230) 原型被标为 `Phase 1 产出`。现有 startPhase 档位无一适用 |
| 2 | **无「原型→数据模型」环节** | `detailed-design.md` 与 `schema.sql` 均为 Phase 1 从 PRD 产出。[L376](../../../agents/flow-orchestrator.md#L376) link-coder 的 DERIVE 读 detailed-design.md，[L404](../../../agents/flow-orchestrator.md#L404) Phase 2.5 执行 schema.sql — 两者同时断源 |
| 3 | **html-to-\* 未接入编排** | 编排表 [L57-L67](../../../agents/flow-orchestrator.md#L57-L67) 仅 9 个 agent，不含两个转换技能 |
| 4 | **无业务语义确认门禁** | 门禁 #2 [L384-L398](../../../agents/flow-orchestrator.md#L384-L398) 7 项全为技术配置（Maven/Node/Database/…），无一项确认业务语义 |

### 逻辑漏洞

| # | 漏洞 | 证据 |
|---|---|---|
| 1 | **Phase 0 检测无法触发「生成新项目」** | [L64](../../../agents/flow-orchestrator.md#L64) 触发条件是「Phase 0 检测到后端项目」，而检测规则 [L215](../../../agents/flow-orchestrator.md#L215) 是「目录下含 pom.xml」。新建 server 目录无 pom.xml → `targets.backend=false` → backend-coder 不启动 |
| 2 | **`startPhase=2.5` 校验漏项** | [L187](../../../agents/flow-orchestrator.md#L187) 表格要求 `systemDesign + prototype + linkContract`，但校验块 [L194-L201](../../../agents/flow-orchestrator.md#L194-L201) 中 `linkContract` 与 `schemaSql` 均为 `>= 3` 才要求 → 2.5 档位会在空契约、空 DDL 下进入建库与编码 |
| 3 | **产物无落盘路径** | Phase 1/2 均未声明产出写入目录，而 Phase 0 [L222](../../../agents/flow-orchestrator.md#L222) 扫描 `docs/`。子代理上下文隔离，不落盘无法交接 |

---

## 三、设计总览

### 改动后的拓扑

```
Phase 0   发现            ← 改 B：把「已有原型」认成输入产物
   ↓
Phase 1.5 原型 → 数据模型   ← 新增 A：新 agent prototype-to-model
   ↓
🛑 门禁 #1                 ← 改 D：扩为「数据模型 + 业务语义」双确认
   ↓
Phase 2   Link 契约        ← 改 E：DERIVE 数据源换成 data-model.md
   ↓
🛑 门禁 #2                 （技术配置，不变）
   ↓
Phase 2.5 建库             （不变）
   ↓
Phase 3   并行编码          ← 改 F：前端/小程序端协议改两步走
   ↓
Phase 4   集成验证          （不变）
   ↓
Phase 5   最终门禁          （不变）
```

### 数据流

```
admin原型.html ──┐
                 ├──→ [Phase 1.5 prototype-to-model] ──→ data-model.md
miniapp原型.html ─┘                                      pending-decisions.md
                                                         schema.sql
                                                              │
                                          ┌───────────────────┤
                                          ▼                   ▼
                                   🛑 门禁 #1           Phase 2.5 建库
                                   （数据模型 +               │
                                     业务语义确认）            │
                                          │                   │
                                          ▼                   │
                                   Phase 2 link-coder         │
                                   → api-contract.md          │
                                          │                   │
                          ┌───────────────┼───────────────────┘
                          ▼               ▼               ▼
                  backend-coder    html-to-admin +   html-to-miniapp +
                  （契约驱动）      frontend-coder    mini-program-coder
                                   （转换 + 接后端）   （转换 + 接后端）
```

---

## 四、详细设计

### A. 新增 agent：`agents/prototype-to-model.md`（Phase 1.5）

**职责**：读两份原型，交叉验证，产出机器可读的数据模型与待确认清单。不生成代码，不调用其他 agent。

**执行协议**：

```
1. RECEIVE  接收 flow-orchestrator 调度指令（两份原型路径 + 产品基本信息）
2. PARSE    分别解析两份原型：
            a. 静态盘点（复用 html-to-* 的 analyze_html.py 思路）
            b. 提取：表格列头 / 表单字段与控件类型 / 详情页字段 / 路由与页面清单
            c. 提取：mock 数据结构（admin 的 utils/mock.ts、miniapp 的 utils/mock.js）
3. CROSS    交叉验证（本环节的核心价值）：
            a. 同一实体在两份原型中的字段集合 → 取并集
            b. 同一字段在两端的控件类型 → 比对锁定类型
               （admin 表格列 + miniapp 表单控件 → 类型收敛）
            c. 字段命名冲突 → 标记，进 pending-decisions
            d. 单端独有的实体/字段 → 标记来源端，置信度降级
4. EXTRACT  抽取六类信息：
            实体与字段 / 关系 / 接口清单 / 状态机 / 角色权限 / 枚举集合
5. GAP      标记推不出的项 → pending-decisions.md
            （业务规则、状态流转条件、事务边界、错误码语义、
              字段长度约束、唯一性约束）
6. VERIFY   对照自检清单逐条核验
7. REPORT   输出 <model-compliance> 标记
```

**产出**：

| 文件 | 内容 |
|---|---|
| `docs/data-model.md` | 见下方 Schema |
| `docs/pending-decisions.md` | 待确认业务参数清单 |
| `docs/schema.sql` | 由 data-model.md 派生的 DDL |

**`data-model.md` Schema**：

```markdown
# 数据模型

## 0. 元信息
- 产品名 / 来源原型（两份路径）/ 生成时间
- 交叉验证覆盖率：{两端共现字段数}/{字段总数}

## 1. 实体清单
| 实体 | 表名 | 来源端 | 证据 | 置信度 |

## 2. 实体字段定义
### 2.1 {实体名}
| 字段 | 类型 | 长度 | 可空 | 唯一 | 默认值 | 枚举 | 注释 | 来源证据 | 置信度 |

## 3. 关系
| 源实体 | 目标实体 | 类型 | 基数 | 外键 | 证据 | 置信度 |

## 4. 接口清单
| 方法 | 路径 | 用途 | 请求实体 | 响应实体 | 来源端 | 证据 |

## 5. 状态机
| 实体 | 状态集合 | 流转 | 触发条件 | 证据 | 置信度 |

## 6. 角色与权限
| 角色 | 可访问页面 | 可执行操作 | 来源端 |

## 7. 审计与通用列
（created_at / updated_at / created_by / updated_by / deleted_at 的适用实体）
```

**置信度取值**：`HIGH`（两端共现且控件类型一致）/ `MEDIUM`（单端出现或类型可推断但不唯一）/ `LOW`（推断，需确认）。

**`pending-decisions.md` Schema**：

```markdown
# 待确认业务参数

| # | 项 | 为什么推不出 | 候选值 | 默认建议 | 影响范围 | 状态 |
|---|---|---|---|---|---|---|
| 1 | 订单未支付超时释放时长 | 原型无计时器语义 | 15/30/60 分钟 | 30 分钟 | order.status 流转 | ⬜ 待确认 |
| 2 | 库存扣减时机 | 原型无并发语义 | 下单时/支付时 | 支付时 | 库存服务 | ⬜ 待确认 |
```

**硬约束**：`置信度 = LOW` 或 `状态 = 待确认` 的项，**不得**在后续 Phase 被静默采用默认值落进代码而不留痕。落进代码时必须同时：
1. 在生成的代码处留 `// TODO(decision-#N): {项}` 注释
2. 在 Phase 5 的最终报告中汇总列出

---

### B. Phase 0 改动

**B1. 产物检测表**（[L224-L232](../../../agents/flow-orchestrator.md#L224-L232)）新增/修改行：

| 产物名 | 匹配规则 | Phase 用途 |
|---|---|---|
| 高保真原型 | `prototype/` 目录或文件名含 `prototype` | **Phase 1 产出 / Phase 1.5 输入**（原为 `Phase 1 产出 / Phase 3 输入`） |
| 数据模型 | 文件名含 `data-model` | Phase 1.5 产出 / Phase 2 输入 |
| 待确认项 | 文件名含 `pending-decisions` | Phase 1.5 产出 / 门禁 #1 输入 |

**B2. 起始 Phase 推荐逻辑表**（[L265-L271](../../../agents/flow-orchestrator.md#L265-L271)）新增行：

| 文档产物状况 | 推荐 startPhase | 说明 |
|---|---|---|
| 有原型、无 PRD | **1.5** | 原型驱动：反推数据模型 → 契约 → 编码 |
| 有原型 + 数据模型 | 2 | 跳过反推，直接生成契约 |
| 有原型 + 数据模型 + 契约 | 2.5 | 跳过反推与契约，只建库 + 编码 |

**B3. 项目状态面板**同步增加原型与数据模型的 ✅/❌ 展示行。

---

### C. startPhase 新增 `1.5` 档位

**C1. 典型场景表**（[L182-L190](../../../agents/flow-orchestrator.md#L182-L190)）新增：

| startPhase | 跳过阶段 | 必须提供的外部产物 | 适用场景 |
|---|---|---|---|
| **1.5** | Phase 0-1 | `prototype`（两份原型路径） | 原型已有，无 PRD，反推数据模型 |

**C2. 产物匹配校验块**（[L194-L201](../../../agents/flow-orchestrator.md#L194-L201)）重写为：

```
startPhase >= 1   : project.rootPath 非空
startPhase >= 1.5 : externalInputs.prototypeAdmin + prototypeMiniApp 非空且文件存在
startPhase >= 2   : externalInputs.dataModel 非空 + 文件存在
startPhase >= 2.5 : externalInputs.linkContract 非空 + 文件存在
startPhase >= 2.5 : 数据库已就绪（Phase 2.5 已完成 或 schema.sql 可执行）
startPhase >= 3   : targets 已确认（各端 mode / dirName 齐全）
startPhase >= 4   : 项目目录存在（代码已生成）
```

> **修正说明（漏洞 2）**：原校验块中 `linkContract` 与 `schemaSql` 门槛为 `>= 3`，而 2.5 档位本身即跳过 Phase 2 且需要 schema.sql。新块把两者门槛提到 `>= 2.5`。

**C3. `externalInputs` 新增字段**：

```yaml
externalInputs:
  prototypeAdmin: ""      # 新增：admin 原型路径
  prototypeMiniApp: ""    # 新增：miniapp 原型路径
  dataModel: ""           # 新增：Phase 1.5 产物 data-model.md 路径
  systemDesign: ""        # 保留
  linkContract: ""        # 保留
  schemaSql: ""           # 保留
```

---

### D. 门禁 #1 扩展

门禁 #1（[L338-L356](../../../agents/flow-orchestrator.md#L338-L356)）保留原有 SystemDesign / Prototype 审核，**新增两组**：

**D1. 数据模型审核**

```
□ 实体是否覆盖两份原型的全部页面数据需求？
□ 每个实体的字段是否与原型表格列/表单字段一一对应？
□ 字段类型是否经过两端交叉验证（而非单端推断）？
□ 关系与基数是否正确？（一对多 vs 多对多）
□ 交叉验证覆盖率是否可接受？（低于 60% 需说明）
□ 审计列（created_at/updated_at/created_by/updated_by/deleted_at）是否已标注适用实体？
```

**D2. 业务语义确认**（新增，本设计的核心门禁）

```
逐条确认 pending-decisions.md 中的待确认项：
  | # | 项 | 候选值 | 默认建议 | 你的选择 |
  ─────────────────────────────────────────────
  全部确认 → 写入 data-model.md，进入 Phase 2
  有修正   → 更新 data-model.md 后重新确认
```

> **硬约束**：`pending-decisions.md` 中存在 `状态 = 待确认` 的项时，**禁止**进入 Phase 2。

**D3. 门禁触发条件修正**

门禁 #1 分两组，按 Phase 1 / 1.5 是否实际执行来启用：

| 情形 | 数据模型审核 + 业务语义确认 | SystemDesign / Prototype 审核 |
|---|---|---|
| startPhase ≤ 1（走完整流程或原型由 Phase 1 生成） | ✅ 必过 | ✅ 必过 |
| startPhase = 1.5（原型已有，数据模型由 Phase 1.5 反推） | ✅ 必过 | ❌ 不适用 |
| startPhase = 2（数据模型由外部提供） | ✅ 必过 | ❌ 不适用 |
| startPhase ≥ 2.5 | 已在前次门禁确认 | 不适用 |

> 即：**只要数据模型是本次流程新产出或首次引入的，就必须过数据模型审核 + 业务语义确认**；只有此前已过门禁的产物才可复用而不重复确认。

---

### E. link-coder 的 DERIVE 换数据源

[agents/link-coder.md](../../../agents/link-coder.md) 的 DERIVE 步骤：

- **原**：`读取 Phase 1 产出的 detailed-design.md → 提取数据库字段类型`
- **改为**：`读取 Phase 1.5 产出的 data-model.md → 提取实体字段类型与长度约束`

同时，示例值推导规则表的来源列（原 `来源（DB字段）`）改为引用 `data-model.md` 的字段定义行。

自检清单新增：
```
□ DERIVE 是否读取的是 data-model.md（而非 detailed-design.md）？
□ 契约中字段的「来源」列是否引用了 data-model.md 的具体行？
```

---

### F. Phase 3 前端/小程序端改为两步走

**F1. 协议改动**

`frontend-coder` 与 `mini-program-coder` 的执行协议插入 **CONVERT** 步骤，置于 BUILD 之前：

```
1. RECEIVE  接收调度指令（契约 + 本机环境 + 原型路径）
2. LOAD     rule / skill
3. KNOWLEDGE knowledge/
4. CONVERT  ★ 新增：调用 html-to-admin / html-to-miniapp，
            从原型转换出页面骨架（UI / 布局 / 路由 / 交互）
            产出：{end} 项目 + 转换期 mock 数据
5. EXECUTE  按 Link 契约生成 API 层，覆盖转换期 mock
6. VERIFY   对照 rule 逐条自检
7. BUILD    构建
8. SELF-TEST 页面四态 + 真实接口联调
9. CLEANUP  确认 mock 已清除、baseUrl 指向真实后端
10. REPORT  <binding-compliance>
```

**F2. mock 存活期裁决**

两个转换技能要求「数据集中在 `utils/mock.ts`，不实现 API 请求」，与本仓库既有协议冲突。裁决：

| mock 类型 | 归属 | 存活期 |
|---|---|---|
| 转换期 mock（html-to-* 产出） | CONVERT 步骤 | 至 EXECUTE 步骤结束，被 API 层完全覆盖 |
| 自测 mock（契约驱动） | SELF-TEST 步骤 | 至 CLEANUP 步骤结束 |

**规则**：EXECUTE 步骤结束时，转换期 mock 必须已被 API 层替换；CLEANUP 步骤结束时，所有 mock 必须已清除。两个转换技能的「不实现后端业务逻辑」约束**仅作用于 CONVERT 步骤**，不延伸到 EXECUTE。

**F3. 自检清单新增**

```
□ CONVERT 步骤是否已调用 html-to-*（而非手工编写页面）？
□ 转换期 mock 是否已被 API 层完全覆盖（无残留）？
□ CLEANUP 后 baseUrl 是否指向真实后端地址？
```

**F4. 编排表改动**（[L57-L67](../../../agents/flow-orchestrator.md#L57-L67)）

新增一行，并修改前端/小程序两行的 Phase 列：

| # | Name | Agent File | Phase | Trigger |
|---|---|---|---|---|
| **1.5★** | **Prototype→Model** | **[prototype-to-model.md](../../../agents/prototype-to-model.md)** | **1.5** | **startPhase ≤ 1.5 且检测到两份原型** |
| 6 | Frontend | frontend-coder.md | 3 | Phase 0 检测到 / 目标含前端项目。**含 CONVERT（html-to-admin）+ 接后端两步** |
| 7 | MiniProgram | mini-program-coder.md | 3 | 同上。**含 CONVERT（html-to-miniapp）+ 接后端两步** |

同时更新绑定关系链拓扑图（[L19-L49](../../../agents/flow-orchestrator.md#L19-L49)）插入 Phase 1.5 节点。

---

### G. 三个漏洞的修法

**G1. 漏洞 1 — targets 语义改造**

`targets` 由「Phase 0 检测结果」改为「检测 + 目标」二元结构：

```yaml
targets:
  backend:
    enabled: true
    mode: "generate"      # generate（新建） / enhance（已有项目上改）
    detected: false       # Phase 0 是否扫到已有项目目录
    dirName: "vitrine-server"   # 待生成的目录名（mode=generate 时由用户提供）
```

Phase 0 的检测规则补充：

```
目录下含 pom.xml          → backend  mode=enhance, detected=true
目录不存在 / 无 pom.xml    → backend  mode=generate, detected=false
                              → 询问用户待生成的项目目录名
```

同理适用于 frontend / miniProgram。

**G2. 漏洞 2 — 已由 C2 修正**

**G3. 漏洞 3 — 产物落盘约定**

统一落盘根路径为 `{project.rootPath}/docs/`：

```
{project.rootPath}/
  ├── docs/
  │   ├── data-model.md           Phase 1.5 产出
  │   ├── pending-decisions.md    Phase 1.5 产出
  │   ├── schema.sql              Phase 1.5 产出
  │   ├── api-contract.md         Phase 2 产出
  │   ├── prototype/              Phase 1 产出（若走完整流程）
  │   └── reports/
  │       ├── db-execution.md     Phase 2.5 产出
  │       ├── compliance-{end}.md Phase 3 产出
  │       └── integration.md      Phase 4 产出
  ├── {backend dir}/
  ├── {frontend dir}/
  └── {miniProgram dir}/
```

**规则**：所有端级 agent 的产出必须落盘到上述路径，不得仅在对话中返回。flow-orchestrator 在 POST-FLIGHT 中按路径读取核对。

---

## 五、错误处理

| 场景 | 处理 |
|---|---|
| 原型文件不可读 / 为空 | Phase 1.5 拒绝执行，报告缺失路径 |
| 两份原型无任何共现实体 | 交叉验证失效 → 告警，全部字段置信度降为 MEDIUM，强制全部进 pending-decisions |
| `pending-decisions.md` 存在待确认项 | 门禁 #1 阻断，禁止进入 Phase 2 |
| data-model.md 缺少必填段（1-7 节） | link-coder 拒绝 DERIVE，返回 Phase 1.5 |
| 转换期 mock 在 EXECUTE 后仍有残留 | POST-FLIGHT 判 FAIL，触发修复轮 |
| Phase 1.5 自检 FAIL | 最多 3 轮修复，仍 FAIL 则上报 |

---

## 六、验收标准

1. 给出两份原型路径 + `startPhase: 1.5`，flow-orchestrator 能完成全流程编排，无需 PRD
2. Phase 1.5 产出的 `data-model.md` 含全部 7 节，且每个字段标注来源证据与置信度
3. `pending-decisions.md` 中每项均被门禁 #1 逐条确认后才进入 Phase 2
4. `api-contract.md` 的字段「来源」列引用 `data-model.md` 的具体行
5. admin 与 miniapp 项目由 html-to-* 转换产出，EXECUTE 后无转换期 mock 残留
6. 三端 `pageNum`/`pageSize`、Token 键名、Long→String、错误码映射一致
7. 新建的 server 项目（Phase 0 扫不到 `pom.xml`）能被正确触发 backend-coder
8. `startPhase: 2.5` 在缺少 `linkContract` 或 `schemaSql` 时被拒绝执行

---

## 七、不在本次范围内

| 项 | 原因 |
|---|---|
| Phase 1（system-design-coder / prototype-coder）的 rule/skill 建设 | 本设计在原型驱动场景下跳过 Phase 1 |
| html-to-* 内部流程改造 | 7 阶段 / 5 阶段流程保持不变 |
| knowledge/ 71 个空壳文件填充 | 独立议题 |
| agents → `.claude/agents/` 的可执行化转换 | 独立子项目，本设计只定义协议不改打包方式 |
| rules/backend/domain/ 后端行业规则层 | 独立子项目。本设计通过 pending-decisions 机制绕过，不依赖它 |

---

## 八、附：改动文件清单

| 文件 | 改动类型 |
|---|---|
| `agents/prototype-to-model.md` | **新增** |
| `agents/flow-orchestrator.md` | 改：B（Phase 0 检测）、C（startPhase 1.5 + 校验块）、D（门禁 #1）、F（Phase 3 协议）、G（漏洞 1/3）、拓扑图、编排表、落盘约定 |
| `agents/link-coder.md` | 改：E（DERIVE 数据源） |
| `agents/frontend-coder.md` | 改：F1（CONVERT 步骤）、F2（mock 裁决）、F3（自检清单） |
| `agents/mini-program-coder.md` | 改：同 frontend-coder |
| `docs/data-model.md` | 运行时产出（非仓库文件） |
| `docs/pending-decisions.md` | 运行时产出（非仓库文件） |
