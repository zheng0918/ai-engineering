# cache — 缓存生成技能

> 本技能根据 `rule.md` 约束生成 Redis 配置与缓存使用代码。

---

## 触发条件

当用户要求"添加缓存"、"配置 Redis"、"缓存热点数据"时触发。

---

## 生成模板

### RedisConfig

```java
package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置，统一序列化方式。
 */
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

### CacheConfig（Spring Cache）

```java
package com.example.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Spring Cache 配置（基于 Redis）。
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaults)
                // 字典缓存 1 小时
                .withCacheConfiguration("dict",
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofHours(1)))
                // 用户会话缓存 5 分钟
                .withCacheConfiguration("userSession",
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5)))
                .build();
    }
}
```

### 注解方式使用缓存

```java
@Slf4j
@Service
public class SysDictServiceImpl extends ServiceImpl<SysDictMapper, SysDict>
        implements SysDictService {

    @Override
    @Cacheable(value = "dict", key = "#dictType", unless = "#result == null")
    public List<SysDictVO> listByType(String dictType) {
        return lambdaQuery()
                .eq(SysDict::getDictType, dictType)
                .orderByAsc(SysDict::getSort)
                .list()
                .stream().map(dictConverter::toVO).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = "dict", key = "#dto.dictType")
    public void updateDict(DictUpdateDTO dto) {
        // 更新逻辑 ...
    }
}
```

### 手动方式使用缓存

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class CacheSupport {

    private final RedisTemplate<String, Object> redisTemplate;

    public void set(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) return null;
        return type.isInstance(value) ? (T) value : null;
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
```

### 降级处理

```java
public List<SysDictVO> listByTypeWithFallback(String dictType) {
    try {
        List<SysDictVO> cached = cacheSupport.get("dict:" + dictType, List.class);
        if (cached != null) return cached;
    } catch (Exception e) {
        log.error("Redis 查询失败，降级查 DB dictType={}", dictType, e);
    }

    // 降级到 DB
    List<SysDictVO> fromDb = queryFromDb(dictType);
    try {
        cacheSupport.set("dict:" + dictType, fromDb, Duration.ofHours(1));
    } catch (Exception e) {
        log.error("Redis 回写失败 dictType={}", dictType, e);
    }
    return fromDb;
}
```

---

## application.yml Redis 配置

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}       # 生产环境通过环境变量覆盖，绝不能输出到日志
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 4
```

---

## 生成时注意事项

1. **Redis 密码绝不硬编码在 yml**
2. **缓存必须设 TTL，禁止永不过期**
3. **`@CacheEvict` 必须与写操作在同一 `@Transactional` 边界内**
4. **Redis 不可用时必须有降级方案（查 DB）**
5. **缓存 Key 使用 `{业务域}:{子域}:{ID}` 格式**
6. **禁用 `KEYS *` 命令（生产环境）**
