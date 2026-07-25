# scheduled — 定时任务规范

> 本文件规定 Spring 定时任务与 XXL-Job 的配置与使用规范。

---

## 1. 定时任务方案选型

| 方案 | 适用场景 | 说明 |
|---|---|---|
| `@Scheduled` | 单机、简单定时任务 | 开发轻量，不保证分布式唯一执行 |
| XXL-Job | 分布式、可管理、需监控 | 生产推荐，支持动态调度、分片、失败重试 |

---

## 2. @Scheduled 方案

### 2.1 启用定时任务

```java
@SpringBootApplication
@EnableScheduling
@MapperScan("com.example.mapper")
public class XxxApplication {
    public static void main(String[] args) {
        SpringApplication.run(XxxApplication.class, args);
    }
}
```

### 2.2 定时任务实现

```java
/**
 * 定时任务调度。
 * cron 6 字段：秒 分 时 日 月 星期
 */
@Slf4j
@Component
public class ScheduledTasks {

    private final TaskService taskService;

    public ScheduledTasks(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * 每 5 分钟扫描超时未完成的任务。
     * cron: 秒=0, 分=每5分钟(0/5), 时=*, 日=*, 月=*, 星期=*
     */
    @Scheduled(cron = "0 */5 * * * *")
    public void scanTimeoutTasks() {
        log.info("开始扫描超时任务");
        int count = taskService.markTimeoutTasks();
        log.info("扫描超时任务完成 count={}", count);
    }

    /**
     * 每天凌晨 2 点清理过期日志。
     * cron: 秒=0, 分=0, 时=2, 日=*, 月=*, 星期=*
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanExpiredLogs() {
        log.info("开始清理过期日志");
        // 清理逻辑
    }
}
```

### 2.3 异步执行（避免阻塞定时任务线程）

```java
@Slf4j
@Component
public class ScheduledTasks {

    /**
     * 异步扫描超时任务，不阻塞定时任务线程池。
     */
    @Async("asyncExecutor")
    @Scheduled(cron = "0 */5 * * * *")
    public void scanTimeoutTasks() {
        log.info("开始扫描超时任务");
        // ...
    }
}
```

---

## 3. XXL-Job 方案（推荐生产使用）

### 3.1 依赖

```xml
<!-- XXL-Job：分布式定时任务调度 -->
<dependency>
    <groupId>com.xuxueli</groupId>
    <artifactId>xxl-job-core</artifactId>
    <version>2.4.1</version>
</dependency>
```

### 3.2 配置

```yaml
xxl:
  job:
    admin:
      addresses: ${XXL_JOB_ADMIN:http://localhost:8080/xxl-job-admin}
    accessToken: ${XXL_JOB_TOKEN:}           # 绝不能输出到日志
    executor:
      appname: ${spring.application.name}
      port: ${XXL_JOB_EXECUTOR_PORT:9999}
      logpath: ${LOG_PATH:-./logs}/xxl-job
      logretentiondays: 30
```

```java
@Configuration
public class XxlJobConfig {

    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;

    @Value("${xxl.job.accessToken}")
    private String accessToken;

    @Value("${xxl.job.executor.appname}")
    private String appname;

    @Value("${xxl.job.executor.port}")
    private int port;

    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {
        XxlJobSpringExecutor executor = new XxlJobSpringExecutor();
        executor.setAdminAddresses(adminAddresses);
        executor.setAccessToken(accessToken);
        executor.setAppname(appname);
        executor.setPort(port);
        return executor;
    }
}
```

### 3.3 Job Handler 实现

```java
@Slf4j
@Component
public class TaskScanJob {

    private final TaskService taskService;

    public TaskScanJob(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * 扫描超时未完成任务。
     * 分片：按 owner_id % shardTotal 分配，避免重复处理。
     */
    @XxlJob("scanTimeoutTasks")
    public void scanTimeoutTasks() {
        int shardIndex = XxlJobHelper.getShardIndex();
        int shardTotal = XxlJobHelper.getShardTotal();
        log.info("开始扫描超时任务 shardIndex={} shardTotal={}", shardIndex, shardTotal);

        int count = taskService.markTimeoutTasks(shardIndex, shardTotal);
        log.info("扫描超时任务完成 shardIndex={} count={}", shardIndex, count);

        XxlJobHelper.handleSuccess("处理 " + count + " 条");
    }
}
```

---

## 4. 定时任务日志规范

| 场景 | 级别 | 示例 |
|---|---|---|
| 任务开始 | INFO | `log.info("开始扫描超时任务")` |
| 任务结束 | INFO | `log.info("扫描完成 count={} 成功={} 失败={}", total, success, fail)` |
| 处理异常 | ERROR | `log.error("处理任务失败 taskId={}", taskId, e)` |

---

## 5. 禁止事项

- ❌ 定时任务无汇总日志（只有逐条日志刷屏）
- ❌ 分布式环境下裸用 `@Scheduled`（多实例重复执行）
- ❌ cron 表达式不写注释说明含义
- ❌ 定时任务阻塞主线程（应使用 `@Async` 或独立线程池）
- ❌ accessToken 明文输出到日志
