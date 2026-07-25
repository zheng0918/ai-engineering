# database — 数据库生成技能

> 本技能根据 `rule.md` 约束生成 DDL 建表脚本、初始化数据与迁移文件。

---

## 触发条件

当用户要求"生成建表 SQL"、"创建数据库表"、"写迁移脚本"、"生成初始数据"时触发。

---

## 生成清单

- [ ] `V1__init_schema.sql` — 建表迁移
- [ ] `V2__init_data.sql` — 初始化数据（按需）
- [ ] 每张表 `CREATE TABLE` + `COMMENT ON TABLE` + `COMMENT ON COLUMN`
- [ ] 索引创建

---

## 建表 SQL 模板

```sql
-- =====================================================================
-- {项目名} · {schema} 初始化 DDL
-- 目的：建{业务描述}所需全部业务表。
-- 破坏性：否（仅 CREATE IF NOT EXISTS，幂等可重跑）。
-- 依赖：PostgreSQL 16。
-- 约定：所有业务表含审计列 tenant_id / created_by / updated_by
--       / deleted_at / created_at / updated_at；逻辑删除以 deleted_at 是否为 NULL 判定。
-- =====================================================================

-- ---------------------------------------------------------------------
-- {表中文名} {table_name}
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS {table_name} (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(128) NOT NULL,
    description   TEXT,
    owner_id      BIGINT NOT NULL,
    status        VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    tenant_id     BIGINT NOT NULL DEFAULT 0,
    metadata      JSONB NOT NULL DEFAULT '{}',
    created_by    BIGINT,
    updated_by    BIGINT,
    deleted_at    TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE  {table_name} IS '{表用途说明}。{隔离规则}。';
COMMENT ON COLUMN {table_name}.name IS '{字段业务含义}，≤128 字符。';
COMMENT ON COLUMN {table_name}.owner_id IS '{关联说明}。';
COMMENT ON COLUMN {table_name}.status IS '{状态取值范围}。';
COMMENT ON COLUMN {table_name}.deleted_at IS '逻辑删除时间戳；NULL 表示未删除。';
COMMENT ON COLUMN {table_name}.tenant_id IS '租户 ID，预留多租户隔离。';
COMMENT ON COLUMN {table_name}.created_by IS '创建人用户 ID。';
COMMENT ON COLUMN {table_name}.updated_by IS '更新人用户 ID。';
COMMENT ON COLUMN {table_name}.created_at IS '创建时间。';
COMMENT ON COLUMN {table_name}.updated_at IS '更新时间。';

-- 索引
CREATE INDEX IF NOT EXISTS idx_{table}_owner ON {table_name}(owner_id) WHERE deleted_at IS NULL;
```

---

## 表模板变体

### 带唯一约束

```sql
CREATE TABLE IF NOT EXISTS kb_members (
    id         BIGSERIAL PRIMARY KEY,
    kb_id      BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    permission VARCHAR(16) NOT NULL,
    -- ... 审计列 ...
    UNIQUE (kb_id, user_id)
);
COMMENT ON COLUMN kb_members.permission IS '权限：read 只读 / write 读写。';
```

### 多状态字段（如任务表）

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(16) NOT NULL,                -- TASK_TYPE_A | TASK_TYPE_B
    title       VARCHAR(255),
    status      VARCHAR(16) NOT NULL,                -- RUNNING | DONE | FAILED
    owner_id    BIGINT NOT NULL,
    priority    INT NOT NULL DEFAULT 0,
    -- ... 审计列 ...
);
COMMENT ON COLUMN tasks.type IS '任务类型：TYPE_A/TYPE_B。';
COMMENT ON COLUMN tasks.status IS '任务状态：RUNNING 进行中 / DONE 完成 / FAILED 失败。';
CREATE INDEX IF NOT EXISTS idx_tasks_owner_status ON tasks(owner_id, status) WHERE deleted_at IS NULL;
```

---

## 初始化数据模板

> **密码哈希必须用 `BCryptPasswordEncoder.encode()` 生成，严禁手动编造。将输出结果填入模板。**

```java
// 生成哈希的代码（不在迁移脚本中，仅在生成迁移脚本时运行一次）
String hash = new BCryptPasswordEncoder().encode("admin123");
System.out.println(hash);
```

```sql
-- =====================================================================
-- 初始化数据
-- =====================================================================
-- 初始管理员（密码 admin123 的 BCrypt 哈希，仅 dev/POC 使用，生产必须改密码）
-- ★ 哈希值必须用 BCryptPasswordEncoder.encode() 生成后填入，禁止手工编写
INSERT INTO users (username, password_hash, real_name, role, status)
SELECT 'admin', '<用上述Java代码生成的哈希值>', '系统管理员', 'admin', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
```

---

## 迁移文件命名与头部注释

```sql
-- =====================================================================
-- 目的：{一句话描述}
-- 破坏性：{是/否}（{说明}）
-- 依赖：{V{n-1}__xxx.sql}
-- 幂等：{是/否}（{说明}）
-- =====================================================================
```

---

## 生成时注意事项

1. **所有表必须用 `IF NOT EXISTS`（幂等）**
2. **审计列统一：tenant_id, created_by, updated_by, deleted_at, created_at, updated_at**
3. **`COMMENT ON TABLE` 和 `COMMENT ON COLUMN` 必须与 `CREATE TABLE` 同文件**
4. **索引必须加 `WHERE deleted_at IS NULL` 条件**
5. **`JSONB` 字段默认值 `'{}'`**
6. **VARCHAR 优先（不用 TEXT 除非明确需要）**
7. **初始化 `INSERT` 必须用 `WHERE NOT EXISTS` 防止重复**
8. **密码哈希必须通过 `BCryptPasswordEncoder.encode()` 生成，严禁手动编造或从其他来源复制**
