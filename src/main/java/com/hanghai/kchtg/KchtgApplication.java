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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(KchtgApplication.class);

    @Bean
    public org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy flywayMigrationStrategy(
            javax.sql.DataSource dataSource) {
        return flyway -> {
            // Fix Flyway schema history corruption: remove duplicate DELETE entries
            try (java.sql.Connection conn = dataSource.getConnection()) {
                conn.setAutoCommit(false);
                try (java.sql.Statement stmt = conn.createStatement()) {
                    // Remove duplicate DELETE-type entries keeping only the first one per version
                    stmt.executeUpdate(
                        "DELETE FROM flyway_schema_history " +
                        "WHERE installed_rank IN (" +
                        "  SELECT installed_rank FROM (" +
                        "    SELECT installed_rank, version, type," +
                        "           ROW_NUMBER() OVER (PARTITION BY version, type ORDER BY installed_rank) AS rn" +
                        "    FROM flyway_schema_history WHERE type = 'DELETE'" +
                        "  ) t WHERE rn > 1" +
                        ")"
                    );
                    conn.commit();
                } catch (Exception ex) {
                    conn.rollback();
                    // Non-fatal: log and continue
                    System.err.println("[WARN] Flyway history cleanup failed (non-fatal): " + ex.getMessage());
                }
            } catch (Exception e) {
                System.err.println("[WARN] Could not connect to clean Flyway history: " + e.getMessage());
            }
            try {
                flyway.repair();
            } catch (Exception e) {
                System.err.println("[WARN] Flyway repair failed (continuing): " + e.getMessage());
            }
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
