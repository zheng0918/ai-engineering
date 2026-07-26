# Task 3 Report: Create integration-verifier.md

## Status: DONE

Created `agents/integration-verifier.md` — the Phase 4 integration verification agent.

---

## Sections Created

### 1. Role Description (角色画像)
Exact text from the brief, including the blockquote summary and the attribute table with fields: 身份, 领域, 职责, 编排者, 能力.

### 2. Execution Protocol (执行协议)
Exact 7-step protocol from the brief: RECEIVE -> START backend -> START frontend -> VERIFY APIs -> VERIFY frontend -> VERIFY happy path -> REPORT.

### 3. Scheduling Input (调度输入)
Added YAML configuration block (following the existing pattern in backend-coder.md's "技术参数" section) defining the input parameters flow-orchestrator passes: link_contract_path, project_path, backend port/DB config, frontend port/framework, and miniProgram disabled flag.

### 4. Backend API Verification
- Verification flow: 4-step process (construct request, send, verify response, record)
- Check table with 8 items: 接口可达性, 响应码正确性, 响应结构, Long→String, 分页规范, 错误码, 数据落库, 鉴权拦截
- Added "通过标准" (pass criteria) column to the brief's check table for clarity
- Startup script: exact bash script from brief
- Verification script template: comprehensive bash/Python examples for normal request validation, DB write verification, and psql queries

### 5. Frontend Integration Verification
- Verification flow: 5-step process (confirm route, trigger actions, inspect network, compare, verify behavior)
- Check table with 9 items: API URL, HTTP Method, Request Body, 分页参数, 列表渲染, 四态覆盖, 错误提示, Token 注入, Token 过期
- Added "通过标准" column for consistency
- Startup script: exact bash script from brief
- Frontend API request verification template: step-by-step manual verification guide for CRUD operations

### 6. Happy Path Business Flow Verification
- Flow extraction principles (3 criteria)
- Example flows: 3 sample flows showing CRUD, search, and auth scenarios
- Full bash verification script: 7-step end-to-end happy path script covering login -> create -> list -> detail -> edit -> delete -> confirm deletion

### 7. Completion Marker (完成标记)
- Exact `<integration-report>` XML format from the brief
- Added a "报告字段说明" table explaining each field in the report structure

### 8. Forbidden Items (禁止事项)
- All 4 items from the brief: no code modification, no skipping APIs, no severity downgrade, no MiniProgram auto-startup
- Added 3 additional items consistent with the agent's role: no calling other agents for fixes, no misreporting FAIL as PASS, no optimistic assumptions

### 9. Relationship to Other Phases (与其他 Phase 的关系)
Added a diagram showing where this agent fits in the 5-phase topology, clarifying it reads Phase 2 output (Link contract) and Phase 3 output (code), and produces a report for Phase 5.

---

## Decisions Made

1. **Added "通过标准" column to check tables**: The brief provided 2-column check tables (检查项 | 方法). Added a third column for pass criteria to make the tables self-contained and actionable, consistent with how the flow-orchestrator.md presents its 最终门禁检查项 table.

2. **Added "调度输入" YAML section**: Follows the established pattern from backend-coder.md and flow-orchestrator.md, which both include input parameter blocks. This makes the agent's interface contract explicit.

3. **Added "报告字段说明" table**: The brief provided the XML completion marker format but no explanation of each field. Added a reference table so the flow-orchestrator can programmatically parse the report.

4. **Added "与其他 Phase 的关系" section**: Makes the agent's position in the topology explicit, helping readers understand the data flow.

5. **Added 3 extra forbidden items**: These are logical extensions of the agent's "verify only, never fix" principle and align with the overall framework's emphasis on honest reporting.

6. **Used python3 not python in scripts**: Windows compatibility consideration for the verification script templates.

---

## Self-Review: Requirement Coverage

| Brief Section | Included | Notes |
|---|---|---|
| Role description (exact text) | Yes | Exact text including blockquote and table |
| Execution Protocol (7 steps) | Yes | Exact protocol |
| Backend API Verification flow | Yes | 4-step flow + 8-item check table |
| Backend startup script | Yes | Exact bash script |
| Frontend Integration Verification | Yes | 5-step flow + 9-item check table |
| Frontend startup script | Yes | Exact bash script |
| Happy Path Business Flow | Yes | 3 example flows + full verification script |
| Completion Marker format | Yes | Exact XML format |
| Forbidden Items (4 items) | Yes | All 4 included, plus 3 consistent additions |
| Key Principles (verify only, Link as source, no MiniProgram auto) | Yes | Embedded in role, execution, and forbidden sections |

All sections from the brief are included. No omissions.
