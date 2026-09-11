package com.hanghai.kchtg;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.redis.connection.RedisClusterConnection;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisSentinelConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.dao.DataAccessException;

import java.lang.reflect.Proxy;

@SpringBootApplication
@EnableJpaAuditing
public class KchtgApplication {
    public static void main(String[] args) {
        SpringApplication.run(KchtgApplication.class, args);
    }

    @Bean
    public org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LocalNoOpRedisConnectionFactory();
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }

    public static class LocalNoOpRedisConnectionFactory implements RedisConnectionFactory {
        @Override
        public RedisConnection getConnection() {
            return (RedisConnection) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class[]{RedisConnection.class},
                (p, m, a) -> {
                    if (m.getReturnType().equals(boolean.class)) return false;
                    if (m.getReturnType().equals(int.class)) return 0;
                    if (m.getReturnType().equals(long.class)) return 0L;
                    return null;
                }
            );
        }

        @Override
        public RedisClusterConnection getClusterConnection() { return null; }

        @Override
        public RedisSentinelConnection getSentinelConnection() { return null; }

        @Override
        public boolean getConvertPipelineAndTxResults() { return false; }

        @Override
        public DataAccessException translateExceptionIfPossible(RuntimeException exception) { return null; }
    }
}
