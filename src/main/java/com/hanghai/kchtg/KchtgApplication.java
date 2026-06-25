package com.hanghai.kchtg;

import com.hanghai.kchtg.config.NoOpRedisConnectionFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@SpringBootApplication
@EnableJpaAuditing
public class KchtgApplication {
    public static void main(String[] args) {
        SpringApplication.run(KchtgApplication.class, args);
    }
    @Bean @Profile("local")
    public RedisConnectionFactory redisConnectionFactory() {
        return new NoOpRedisConnectionFactory();
    }
    @Bean @Profile("local")
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }
}
