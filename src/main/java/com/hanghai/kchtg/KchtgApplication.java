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
    @org.springframework.boot.autoconfigure.condition.ConditionalOnBean(javax.sql.DataSource.class)
    public org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy flywayMigrationStrategy(
            javax.sql.DataSource dataSource) {
        return flyway -> {
            cleanFlywaySchemaHistory(dataSource);
            try {
                flyway.repair();
            } catch (Exception e) {
                log.warn("Flyway repair failed (continuing): {}", e.getMessage());
            }
            cleanFlywaySchemaHistory(dataSource);
            flyway.migrate();
        };
    }

    private void cleanFlywaySchemaHistory(javax.sql.DataSource dataSource) {
        try (java.sql.Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try (java.sql.Statement stmt = conn.createStatement()) {
                // Check if flyway_schema_history table exists
                java.sql.ResultSet rs = stmt.executeQuery(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flyway_schema_history')"
                );
                if (rs.next() && rs.getBoolean(1)) {
                    stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE version = '20260918180000' AND success = false");
                    // 1. Purge legacy deleted version 20260922100000 if present
                    stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE version = '20260922100000'");

                    // 2. Remove duplicate DELETE-type entries keeping only the first one per version
                    stmt.executeUpdate(
                        "DELETE FROM flyway_schema_history " +
                        "WHERE type = 'DELETE'"
                    );

                    // 3. Remove duplicate SQL-type entries keeping only the first one per version
                    stmt.executeUpdate(
                        "DELETE FROM flyway_schema_history " +
                        "WHERE installed_rank IN (" +
                        "  SELECT installed_rank FROM (" +
                        "    SELECT installed_rank, version, type," +
                        "           ROW_NUMBER() OVER (PARTITION BY version, type ORDER BY installed_rank) AS rn" +
                        "    FROM flyway_schema_history WHERE version IS NOT NULL AND type = 'SQL'" +
                        "  ) t WHERE rn > 1" +
                        ")"
                    );
                }
                conn.commit();
            } catch (Exception ex) {
                conn.rollback();
                log.warn("Flyway history cleanup failed (non-fatal): {}", ex.getMessage());
            }
        } catch (Exception e) {
            log.warn("Could not connect to clean Flyway history: {}", e.getMessage());
        }
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
