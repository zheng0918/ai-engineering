# feign — 远程调用生成技能

> 本技能根据 `rule.md` 约束生成 WebClient 远程调用 Client。

---

## 触发条件

当用户要求"调用外部 API"、"接入 Python AI 服务"、"实现 SSE 透传"时触发。

---

## 生成模板

### WebClientConfig

```java
package com.example.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.util.concurrent.TimeUnit;

/**
 * WebClient 配置，统一 Timeout/连接池。
 */
@Configuration
public class WebClientConfig {

    /**
     * 通用 WebClient Bean，20s 连接超时 + 300s 读取超时（适配 SSE 长连接）。
     */
    @Bean
    public WebClient webClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 20_000)
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(300, TimeUnit.SECONDS)));

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
```

### 外部服务 Properties

```java
package com.example.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 外部服务配置属性。
 *
 * <p>前缀 {@code app.external-service}。
 */
@Data
@ConfigurationProperties(prefix = "app.external-service")
@Configuration
public class ExternalServiceProperties {

    /** 服务基地址（生产环境通过环境变量覆盖，绝不能输出到日志）。 */
    private String baseUrl;

    /** 内部通信 token（绝不能输出到日志或响应体）。 */
    private String internalToken;

    /** 读取超时秒数，默认 60。 */
    private int readTimeout = 60;

    /** 连接超时秒数，默认 10。 */
    private int connectTimeout = 10;
}
```

```yaml
app:
  external-service:
    base-url: ${EXT_SERVICE_URL:http://localhost:9000}
    internal-token: ${EXT_SERVICE_TOKEN:}
    read-timeout: 60
    connect-timeout: 10
```

### REST 调用 Client

```java
package com.example.common.client;

import com.example.common.exception.BizException;
import com.example.common.exception.ErrorCode;
import com.example.config.ExternalServiceProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

/**
 * 外部服务 HTTP 客户端。
 *
 * <p>封装 REST 调用，统一失败处理与日志。
 * 失败/errcode 非 0 必打 ERROR（含 errcode/errmsg，异常对象作为最后一个参数）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExternalServiceClient {

    private final WebClient webClient;
    private final ExternalServiceProperties props;

    /**
     * POST 调用外部服务。
     *
     * @param path        接口路径（不含 baseUrl）
     * @param requestBody 请求体
     * @return 响应体字符串
     * @throws BizException 调用失败时抛出 AI_SERVICE_UNAVAILABLE
     */
    public String post(String path, Object requestBody) {
        String url = props.getBaseUrl() + path;
        try {
            return webClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + props.getInternalToken())
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(props.getReadTimeout()))
                    .block();
        } catch (WebClientResponseException e) {
            log.error("调用外部服务失败 url={} status={} body={}",
                    url, e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new BizException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        } catch (Exception e) {
            log.error("调用外部服务异常 url={}", url, e);
            throw new BizException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }
}
```

### SSE 流式调用 Client

```java
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;

/**
 * SSE 透传：向外部服务发起流式请求。
 *
 * @param requestBody 请求体 JSON
 * @return SSE 事件流
 */
public Flux<ServerSentEvent<String>> stream(String requestBody) {
    return webClient.post()
            .uri(props.getBaseUrl() + "/api/v1/chat/stream")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .accept(MediaType.TEXT_EVENT_STREAM)
            .retrieve()
            .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
            .doOnError(e -> log.error("SSE 调用失败 url={}", props.getBaseUrl(), e));
}

// Controller 中使用
@GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> chatStream(@Valid ChatStreamQueryDTO query) {
    return chatProxyService.streamChat(query);
}
```

---

## 生成时注意事项

1. **URL 含 token/secret 时禁止全路径打日志**
2. **捕获 WebClientResponseException 并转为 BizException**
3. **异常日志必须把异常对象作为最后一个参数传入**
4. **不向外暴露下游堆栈细节**
5. **Properties 类中的 baseUrl/token 必须标注"不能输出到日志"**
6. **用 `@RequiredArgsConstructor` 注入 WebClient Bean，不用 `new` 创建**
