# mq — 消息队列规范

> 本文件规定消息队列（RabbitMQ / RocketMQ）的使用规范与代码模板。

---

## 1. 消息队列选型

| 方案 | 适用场景 |
|---|---|
| RabbitMQ | 通用异步消息、延迟队列、可靠投递 |
| RocketMQ | 高吞吐、顺序消息、事务消息 |
| Redis Stream | 轻量消息、无需额外中间件 |

默认推荐 **RabbitMQ**。

---

## 2. RabbitMQ 配置

### 2.1 依赖

```xml
<!-- RabbitMQ：异步消息与事件驱动 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

### 2.2 application.yml

```yaml
spring:
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASS:guest}       # 生产环境通过环境变量覆盖，绝不能输出到日志
    virtual-host: /
    # 发布确认
    publisher-confirm-type: correlated
    publisher-returns: true
    # 消费端
    listener:
      simple:
        acknowledge-mode: manual          # 手动确认，保证不丢消息
        retry:
          enabled: true
          max-attempts: 3
          initial-interval: 1000ms
        default-requeue-rejected: false   # 失败不重回（放入死信）
```

### 2.3 配置类

```java
/**
 * RabbitMQ 声明交换器、队列与绑定关系。
 */
@Configuration
public class RabbitMqConfig {

    // ---- 文档解析 ----
    public static final String EXCHANGE_DOCUMENT = "document.exchange";
    public static final String QUEUE_DOC_PARSE = "document.parse.queue";
    public static final String ROUTING_DOC_PARSE = "document.parse";

    @Bean
    public DirectExchange documentExchange() {
        return new DirectExchange(EXCHANGE_DOCUMENT);
    }

    @Bean
    public Queue docParseQueue() {
        return QueueBuilder.durable(QUEUE_DOC_PARSE)
                .deadLetterExchange(EXCHANGE_DOCUMENT)
                .deadLetterRoutingKey("document.parse.dlq")
                .build();
    }

    @Bean
    public Binding docParseBinding() {
        return BindingBuilder.bind(docParseQueue())
                .to(documentExchange())
                .with(ROUTING_DOC_PARSE);
    }
}
```

---

## 3. 生产者

```java
/**
 * 文档解析消息生产者。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentParseProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * 发送文档解析任务到消息队列。
     *
     * @param documentId 文档 ID
     */
    public void sendParseTask(Long documentId) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMqConfig.EXCHANGE_DOCUMENT,
                    RabbitMqConfig.ROUTING_DOC_PARSE,
                    documentId,
                    message -> {
                        message.getMessageProperties().setMessageId(UUID.randomUUID().toString());
                        return message;
                    }
            );
            log.info("发送文档解析任务成功 documentId={}", documentId);
        } catch (Exception e) {
            log.error("发送文档解析任务失败 documentId={}", documentId, e);
            throw new BizException(ErrorCode.SYSTEM_ERROR, "消息发送失败");
        }
    }
}
```

---

## 4. 消费者

```java
/**
 * 文档解析任务消费者。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentParseConsumer {

    private final DocumentService documentService;

    /**
     * 消费文档解析任务。
     *
     * @param message    RabbitMQ 消息
     * @param channel    信道
     */
    @RabbitListener(queues = RabbitMqConfig.QUEUE_DOC_PARSE)
    public void handleParseTask(Message message, Channel channel) {
        Long documentId = null;
        try {
            documentId = (Long) new Jackson2JsonMessageConverter()
                    .fromMessage(message, Long.class);
            log.info("开始处理文档解析任务 documentId={}", documentId);

            documentService.parseDocument(documentId);

            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
            log.info("文档解析任务完成 documentId={}", documentId);
        } catch (BizException e) {
            log.error("文档解析业务失败 documentId={} code={} msg={}",
                    documentId, e.getErrorCode().getCode(), e.getMessage(), e);
            // 业务失败不重试，直接确认并记录
            safeAck(channel, message);
        } catch (Exception e) {
            log.error("文档解析系统异常 documentId={}", documentId, e);
            // 系统异常放回队列重试（或转入死信）
            safeNack(channel, message);
        }
    }

    private void safeAck(Channel channel, Message message) {
        try {
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } catch (Exception ignored) {}
    }

    private void safeNack(Channel channel, Message message) {
        try {
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
        } catch (Exception ignored) {}
    }
}
```

---

## 5. 消息设计规范

| 规范 | 说明 |
|---|---|
| 消息体 | JSON 序列化，包含业务数据 |
| MessageId | 每条消息设置唯一 ID（UUID），用于去重与追溯 |
| 路由 Key | `{domain}.{action}` 格式，如 `document.parse` |
| 死信队列 | 消费失败 N 次后转入 DLQ，避免无限重试 |
| 手动确认 | `acknowledge-mode: manual`，保证不丢消息 |

---

## 6. 禁止事项

- ❌ 自动确认模式（丢消息风险）
- ❌ 消费失败无限重试（必须设置最大重试 + 死信）
- ❌ 消息发送无异常处理
- ❌ 队列/交换器名称硬编码（应在配置类统一声明常量）
- ❌ password / connection 信息明文日志
- ❌ 消费者中做耗时同步操作（应异步化）
