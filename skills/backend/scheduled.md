# scheduled — 定时任务生成技能

> 本技能根据 `rule.md` 约束生成 @Scheduled 与 XXL-Job 定时任务代码。

---

## 触发条件

当用户要求"添加定时任务"、"定时扫描"、"配置 XXL-Job"时触发。

---

## 生成模板

### @Scheduled 方式（简单单机任务）

```java
package com.example.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 定时任务调度。
 *
 * <p>cron 6 字段：秒 分 时 日 月 星期
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final TaskService taskService;

    /**
     * 每 5 分钟扫描超时任务。
     * cron: 秒=0 分=0/5 时=* 日=* 月=* 星期=*
     */
    @Async("asyncExecutor")
    @Scheduled(cron = "0 */5 * * * *")
    public void scanTimeoutTasks() {
        log.info("开始扫描超时任务");
        int count = taskService.markTimeoutTasks();
        log.info("扫描超时任务完成 处理数={}", count);
    }

    /**
     * 每天凌晨 2 点清理过期日志。
     * cron: 秒=0 分=0 时=2 日=* 月=* 星期=*
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanExpiredLogs() {
        log.info("开始清理过期日志");
        // 建议用独立的 @Async 方法执行
    }
}
```

### 启动类启用定时任务

```java
@SpringBootApplication
@EnableScheduling
@EnableAsync
@MapperScan("com.example.mapper")
public class MyappApplication { ... }
```

### XXL-Job 方式（分布式推荐）

```java
package com.example.task;

import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 任务扫描 Job Handler。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TaskScanJob {

    private final TaskService taskService;

    /**
     * 扫描超时未完成任务（支持分片）。
     *
     * <p>按 owner_id % shardTotal 分配，避免多实例重复处理。
     */
    @XxlJob("scanTimeoutTasks")
    public void scanTimeoutTasks() {
        int shardIndex = XxlJobHelper.getShardIndex();
        int shardTotal = XxlJobHelper.getShardTotal();
        log.info("开始扫描超时任务 shardIndex={} shardTotal={}", shardIndex, shardTotal);

        try {
            int count = taskService.markTimeoutTasksByShard(shardIndex, shardTotal);
            log.info("扫描超时任务完成 shardIndex={} 处理数={}", shardIndex, count);
            XxlJobHelper.handleSuccess("处理 " + count + " 条");
        } catch (Exception e) {
            log.error("扫描超时任务失败 shardIndex={}", shardIndex, e);
            XxlJobHelper.handleFail("扫描失败: " + e.getMessage());
        }
    }
}
```

### XXL-Job 配置

```yaml
xxl:
  job:
    admin:
      addresses: ${XXL_JOB_ADMIN:http://localhost:8080/xxl-job-admin}
    accessToken: ${XXL_JOB_TOKEN:}               # 绝不能输出到日志
    executor:
      appname: ${spring.application.name}
      port: ${XXL_JOB_EXECUTOR_PORT:9999}
      logpath: ${LOG_PATH:-./logs}/xxl-job
      logretentiondays: 30
```

---

## cron 表达式速查

| 触发频率 | cron 表达式 | 说明 |
|---|---|---|
| 每分钟 | `0 * * * * *` | 每分 0 秒 |
| 每 5 分钟 | `0 */5 * * * *` | 0,5,10,...,55 分 |
| 每小时 | `0 0 * * * *` | 每整点 |
| 每天凌晨 2 点 | `0 0 2 * * *` | 凌晨 2:00 |
| 每周一凌晨 3 点 | `0 0 3 * * 1` | 周一 3:00 |
| 每月 1 号凌晨 1 点 | `0 0 1 1 * *` | 每月 1 日 1:00 |

**6 字段格式：秒 分 时 日 月 星期**

---

## 生成时注意事项

1. **每个 cron 表达式必须写注释说明含义**
2. **分布式环境优先使用 XXL-Job（避免多实例重复执行）**
3. **`@Scheduled` 方法应使用 `@Async` 避免阻塞定时任务线程池**
4. **任务开始/结束必须打 INFO 日志 + 处理结果汇总**
5. **异常必须打 ERROR 日志，不能吞掉**
6. **XXL-Job accessToken 绝不能硬编码或输出到日志**
