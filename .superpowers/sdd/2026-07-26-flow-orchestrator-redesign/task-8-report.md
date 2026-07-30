# Task 8 Report: flow-orchestrator.md Complete Rewrite

**Status:** COMPLETE
**Date:** 2026-07-26
**File:** `agents/flow-orchestrator.md` (324 lines -> 452 lines)

## Summary

Complete rewrite of `agents/flow-orchestrator.md` from the old serial topology (Phase 0-5: Spec -> Backend -> Frontend -> MiniProgram -> Link -> Gate) to the new 5-Phase topology:
**"设计驱动 · 契约先行 · 并行编码"**

## What Changed

| # | Section | Change |
|---|---------|--------|
| 1 | Header | New slogan "设计驱动 · 契约先行 · 并行编码" |
| 2 | Binding Chain | Reorganized into 5-Phase topology with phase labels and deliverables |
| 3 | Agent Table | Standalone table with #, Name, File, Phase, Trigger columns; Phase 1 always execute |
| 4 | Project Params | Removed `prototype`/`systemDesign` booleans; added `db:` subsection under backend |
| 5 | Spec Parsing | Added 3-tier strategy (L1 rule matching + L2 LLM fallback + L3 user confirmation) |
| 6 | 5-Phase Workflow | Full ASCII diagram with all phases, parallel execution markers, and gate indicators |
| 7 | Human Gates | Gate #1 (Phase 1 checklist: SystemDesign + Prototype); Gate #2 (tab config: Maven/Database/Middleware/Server/Frontend/MiniProgram) |
| 8 | PRE-FLIGHT/POST-FLIGHT/TERMINAL | Preserved with Phase 1 agent exception noted |
| 9 | Iteration Repair | Scoped to Phase 3 only, dimension-level, max 3 rounds |
| 10 | Final Gate Checklist | Existing items + cross-end consistency, Link contract verification, Happy Path, design consistency, gate compliance |
| 11 | Forbidden Items | Existing 7 items + 5 new: skip human gates, skip Phase 1, incomplete Link contract, unconfirmed config, report SUCCESS for FAIL |

## Phase Topology

```
Phase 0: Spec解析 (L1规则匹配 + L2 LLM兜底 + L3用户确认)
Phase 1: 设计阶段 (system-design-coder + prototype-coder 并行) -> Gate #1
Phase 2: Link契约层 (link-coder 事前契约) -> Gate #2
Phase 3: 并行编码 (Backend+Frontend+MiniProgram 基于同一Link契约并行)
Phase 4: 集成验证 (integration-verifier 启动服务+校验)
Phase 5: 最终门禁 (汇总+禁止项扫描+跨端一致性)
```

## Agent References Used

All 7 agent files were read to confirm correct names, roles, and binding counts:
- `agents/system-design-coder.md` (Phase 1)
- `agents/prototype-coder.md` (Phase 1)
- `agents/link-coder.md` (Phase 2)
- `agents/backend-coder.md` (Phase 3, 18 rule+skill groups)
- `agents/frontend-coder.md` (Phase 3, 19 rule+skill groups)
- `agents/mini-program-coder.md` (Phase 3, 13+16 rule+skill groups)
- `agents/integration-verifier.md` (Phase 4)

## Key Design Decisions

1. **Phase 1 mandatory**: prototype and systemDesign are no longer optional booleans -- design always comes first.
2. **Link is pre-code, not post-validation**: link-coder moved from Phase 4 to Phase 2, generates contracts BEFORE coding starts.
3. **Parallel Phase 3**: Backend, Frontend, and MiniProgram all execute concurrently against the same Link contract.
4. **Human gates at decision points**: Gate #1 validates design quality before contracts are written; Gate #2 confirms configuration before coding starts.
5. **Iteration scope narrowed**: Only Phase 3 internal (dimension-level) with max 3 rounds. Phase 1/2 changes require gate re-confirmation.

## Concerns

- The new file is 452 lines (128 more than original 324). The ASCII workflow diagram accounts for ~120 lines. The prose density is comparable to the original.
- Prototype and SystemDesign rule/skill directories are still marked as "待建设" (pending). This is inherited from the original design and is the same as all 7 agent files.
- The task brief `.superpowers/sdd/2026-07-26-flow-orchestrator-redesign/task-8-brief.md` did not exist at the time of writing -- all requirements were taken from the user's task description.

## Tests

N/A -- this is a documentation/config file rewrite. No code was changed.
