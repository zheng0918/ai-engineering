# validation — 代码校验技能

> 本技能根据 `rule.md` 约束执行代码生成后的强制校验。

---

## 校验顺序

### 第一步：禁止项扫描

```powershell
# JPA 禁止项 + Mapper SQL 注解禁止
Get-ChildItem -Recurse -Include *.java,*.xml,*.yml,*.yaml,pom.xml |
  Select-String -Pattern "JpaRepository|EntityManager|jakarta\.persistence|javax\.persistence|spring-boot-starter-data-jpa|hibernate-core|org\.hibernate"

# Mapper 接口 @Select/@Update 等注解（必须为空）
Get-ChildItem -Recurse -Path src\main\java\com\example\mapper -Include *.java |
  Select-String -Pattern "@Select|@Update|@Insert|@Delete"
```

### 第二步：日志禁止项扫描

```powershell
Get-ChildItem -Recurse -Include *.java |
  Select-String -Pattern "System\.out\.print|System\.err\.print|printStackTrace\(|log\.warn\(|log\.debug\(|log\.trace\("
```

### 第三步：必须项检查

| 检查项 | 验证 |
|---|---|
| Mapper 接口继承 BaseMapper + @Mapper | 扫描 mapper 包 |
| Mapper XML 存在（有自定义 SQL 时） | 扫描 resources/mapper/ |
| Service 继承 IService | 扫描 service 包 |
| ServiceImpl 继承 ServiceImpl | 扫描 service/impl 包 |
| Entity 继承 BaseEntity | 扫描 model/entity 包 |
| Query 继承 PageQuery | 扫描 model/query 包 |
| VO Long ID 有 @JsonSerialize(ToStringSerializer) | 扫描 model/vo 包 |
| VO LocalDateTime 有 @JsonFormat | 扫描 model/vo 包 |

### 第四步：目录结构

```
model/base/BaseEntity.java     — 必须
model/base/PageQuery.java      — 必须
model/entity/                  — 必须
model/vo/                      — 必须
model/dto/                     — 必须
model/query/                   — 必须
resources/mapper/              — 必须
```

### 第五步：编译

```bash
mvn -q -DskipTests compile
```

---

## 一键校验 PowerShell 脚本

```powershell
$ErrorActionPreference = "Continue"
$basePkg = "src/main/java/com/example"

Write-Host "=== 1. JPA 禁止项 ==="
$jpa = Get-ChildItem -Recurse -Include *.java,*.xml,*.yml,*.yaml,pom.xml |
  Select-String -Pattern "JpaRepository|EntityManager|jakarta\.persistence|hibernate-core" -List
if ($jpa) { "FAIL: $($jpa.Count) 命中" } else { "OK" }

Write-Host "=== 2. Mapper SQL 注解禁止 ==="
$anno = Get-ChildItem -Recurse -Path "$basePkg/mapper" -Include *.java |
  Select-String -Pattern "@Select|@Update|@Insert|@Delete" -List
if ($anno) { "FAIL: $($anno.Count) 命中" } else { "OK" }

Write-Host "=== 3. 日志禁止项 ==="
$log = Get-ChildItem -Recurse -Include *.java |
  Select-String -Pattern "System\.out\.print|System\.err\.print|printStackTrace\(|log\.warn\(|log\.debug\(" -List
if ($log) { "FAIL: $($log.Count) 命中" } else { "OK" }

Write-Host "=== 4. 目录结构 ==="
$dirs = @("model/base","model/entity","model/vo","model/dto","model/query","service/impl","resources/mapper","common/result")
foreach ($d in $dirs) {
  if (Test-Path "$basePkg/$d" -or Test-Path "src/main/$d") { "OK: $d" } else { "MISS: $d" }
}

Write-Host "=== 5. 编译 ==="
mvn -q -DskipTests compile
if ($LASTEXITCODE -eq 0) { "OK: 编译通过" } else { "FAIL: 编译失败" }
```
