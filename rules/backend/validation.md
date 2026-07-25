# validation — 代码校验规范

> 本文件规定代码生成后必须执行的校验规则。

---

## 1. 禁止项检查（出现即失败）

| 关键字 | 原因 |
|---|---|
| `JpaRepository` | 禁用 JPA |
| `EntityManager` | 禁用 JPA |
| `jakarta.persistence` | 禁用 JPA |
| `javax.persistence` | 禁用 JPA（旧包） |
| `spring-boot-starter-data-jpa` | 禁用 JPA Starter |
| `hibernate-core` | 禁用 Hibernate |
| `org.hibernate` | 禁用 Hibernate 包 |
| `@Select` / `@Update` / `@Insert` / `@Delete` | **Mapper 接口禁止 SQL 注解** |
| `System.out.println` / `System.err.println` | 必须用 SLF4J |
| `printStackTrace()` | 丢失日志上下文 |
| `log.warn(` / `log.debug(` / `log.trace(` | 仅允许 INFO/ERROR |

---

## 2. 必须项检查（缺失即失败）

| 检查项 | 要求 |
|---|---|
| Mapper 接口 | `extends BaseMapper<Entity>` 且标注 `@Mapper`，**无 SQL 注解** |
| Mapper XML | `resources/mapper/XxxMapper.xml` 存在（若有自定义 SQL） |
| Service 接口 | `extends IService<Entity>` |
| ServiceImpl | `extends ServiceImpl<Mapper, Entity> implements Service` |
| Controller | 只注入 Service，不注入 Mapper |
| 响应体 | 统一使用 `R<T>`，方法名为 `success()` / `fail()` |
| Entity | 继承 `model/base/BaseEntity` |
| Query | 继承 `model/base/PageQuery`，命名为 `XxxQuery`（不带 DTO 后缀） |
| 目录结构 | 含 `model/{base,entity,vo,dto,query}`、`resources/mapper/` |
| 分页 | 列表接口使用 `Page<T>` + `PageResult<T>` |
| 事务 | 写方法含 `@Transactional(rollbackFor = Exception.class)` |
| VO 敏感字段 | 不含 password/token/secret/salt/deleted |
| VO Long 序列化 | Long ID 加 `@JsonSerialize(using = ToStringSerializer.class)` |
| VO 时间注解 | LocalDateTime 加 `@JsonFormat` |
| 日志级别 | 仅 `log.info` 和 `log.error` |
| 日志语言 | 中文 |

---

## 3. 校验执行流程（强制顺序）

```
1. 禁止项扫描 → 命中即停
2. 日志禁止项扫描 → 命中即停
3. Mapper SQL 注解扫描 → @Select/@Update 命中即停
4. 必须项检查
5. Controller 误注入 Mapper 扫描
6. VO 敏感字段 + Long序列化 + 时间注解检查
7. 注释覆盖检查
8. 目录结构检查
9. mvn -q -DskipTests compile
10. 全部 PASS → 汇报完成
```

---

## 4. 扫描命令（Windows PowerShell）

```powershell
# Mapper SQL 注解扫描（必须为空）
Get-ChildItem -Recurse -Path src\main\java\com\example\mapper -Include *.java |
  Select-String -Pattern "@Select|@Update|@Insert|@Delete"

# 日志禁止项扫描
Get-ChildItem -Recurse -Include *.java |
  Select-String -Pattern "System\.out\.print|System\.err\.print|printStackTrace\(|log\.warn\(|log\.debug\("

# VO Long 序列化检查（应有 @JsonSerialize 命中）
Get-ChildItem -Recurse -Path src\main\java\com\example\model\vo -Include *.java |
  Select-String -Pattern "JsonSerialize"
```

---

## 5. 校验失败处理

- **禁止**通过删除/屏蔽/注释绕过
- **禁止**通过重命名绕过敏感字段（`password` → `pwd`）
- **禁止**加 `@SuppressWarnings` 屏蔽
- 与用户需求冲突时，先列冲突，等待确认
