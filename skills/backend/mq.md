# mq — 消息队列生成技能

> 本技能根据 `rule.md` 约束生成 RabbitMQ 生产者与消费者代码。

---

## 触发条件

当用户要求"添加消息队列"、"异步处理"、"RabbitMQ"、"实现消费者"时触发。

---

## 生成模板

### RabbitMqConfig

```java
package com.example.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 声明交换器、队列与绑定关系。
 */
@Configuration
public class RabbitMqConfig {

    // ---- {业务域} ----
    public static final String EXCHANGE = "app.exchange";
    public static final String QUEUE = "app.queue";
    public static final String ROUTING_KEY = "app.routing";
    public static final String DLQ = "app.queue.dlq";
    public static final String DLQ_ROUTING_KEY = "app.routing.dlq";

    @Bean
    public DirectExchange appExchange() {
        return new DirectExchange(EXCHANGE);
    }

    @Bean
    public Queue appQueue() {
        return QueueBuilder.durable(QUEUE)
                .deadLetterExchange(EXCHANGE)
                .deadLetterRoutingKey(DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Queue appDlq() {
        return new Queue(DLQ, true);
    }

    @Bean
    public Binding appBinding() {
        return BindingBuilder.bind(appQueue())
                .to(appExchange())
                .with(ROUTING_KEY);
    }

    @Bean
    public Binding appDlqBinding() {
        return BindingBuilder.bind(appDlq())
                .to(appExchange())
                .with(DLQ_ROUTING_KEY);
    }
}
```

### 生产者

```java
package com.example.mq.producer;

import com.example.config.RabbitMqConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * {业务域}消息生产者。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppMessageProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * 发送{业务}消息。
     *
     * @param payload 消息体
     */
    public void send(Object payload) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMqConfig.EXCHANGE,
                    RabbitMqConfig.ROUTING_KEY,
                    payload,
                    message -> {
                        message.getMessageProperties()
                                .setMessageId(UUID.randomUUID().toString());
                        return message;
                    }
            );
            log.info("消息发送成功 exchange={} routingKey={}",
                    RabbitMqConfig.EXCHANGE, RabbitMqConfig.ROUTING_KEY);
        } catch (Exception e) {
            log.error("消息发送失败", e);
            throw new RuntimeException("消息发送失败", e);
        }
    }
}
```

### 消费者

```java
package com.example.mq.consumer;

import com.example.config.RabbitMqConfig;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.stereotype.Component;

/**
 * {业务域}消息消费者。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppMessageConsumer {

    private final BusinessService businessService;

    /**
     * 消费{业务}消息。
     *
     * @param message RabbitMQ 消息
     * @param channel 信道
     */
    @RabbitListener(queues = RabbitMqConfig.QUEUE)
    public void handle(Message message, Channel channel) {
        String messageId = message.getMessageProperties().getMessageId();
        try {
            Object payload = new Jackson2JsonMessageConverter()
                    .fromMessage(message, Object.class);
            log.info("开始处理消息 messageId={}", messageId);

            businessService.process(payload);

            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
            log.info("消息处理完成 messageId={}", messageId);
        } catch (Exception e) {
            log.error("消息处理失败 messageId={}", messageId, e);
            // 拒绝消息且不重新入队（转入死信）
            try {
                channel.basicNack(message.getMessageProperties().getDeliveryTag(),
                        false, false);
            } catch (Exception ignored) {}
        }
    }
}
```

---

## application.yml RabbitMQ 配置

```yaml
spring:
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASS:guest}       # 生产环境通过环境变量覆盖，绝不能输出到日志
    virtual-host: /
    publisher-confirm-type: correlated
    publisher-returns: true
    listener:
      simple:
        acknowledge-mode: manual            # 手动 ACK
        retry:
          enabled: true
          max-attempts: 3
          initial-interval: 1000ms
        default-requeue-rejected: false     # 失败不重试 → 死信
```

---

## 生成时注意事项

1. **使用手动 ACK（`acknowledge-mode: manual`）**
2. **必须配置死信队列，避免无限重试**
3. **每条消息设置唯一 `messageId` 用于追溯**
4. **`@RabbitListener` 方法中异常必须正确处理（ACK/NACK）**
5. **交换器/队列/路由 Key 使用常量，不硬编码字符串**
6. **日志中不输出 RabbitMQ 密码/连接字符串**
