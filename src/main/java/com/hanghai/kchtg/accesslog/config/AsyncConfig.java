package com.hanghai.kchtg.accesslog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Cấu hình thread pool cho {@code AsyncLogAppender}.
 * <p>
 * F-005: Replaces the raw {@code Thread} used in AsyncLogAppender with a
 * managed Spring {@code ThreadPoolTaskExecutor} for proper lifecycle management.
 * </p>
 */
@Configuration("accessLogAsyncConfig")
@EnableAsync
public class AsyncConfig {

    private static final int DEFAULT_CORE_POOL_SIZE = 10;
    private static final int DEFAULT_MAX_POOL_SIZE = 25;
    private static final int DEFAULT_QUEUE_CAPACITY = 5000;

    /**
     * Thread pool for async log appender.
     * <p>
     * Configurable via:
     * - {@code LOG_ASYNC_POOL_SIZE} — core pool size (default 10)
     * - {@code LOG_ASYNC_QUEUE_CAPACITY} — queue capacity (default 5000)
     * </p>
     */
    @Bean(name = "logAppenderExecutor")
    public Executor logAppenderExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Integer.getInteger("LOG_ASYNC_POOL_SIZE", DEFAULT_CORE_POOL_SIZE));
        executor.setMaxPoolSize(DEFAULT_MAX_POOL_SIZE);
        executor.setQueueCapacity(Integer.getInteger("LOG_ASYNC_QUEUE_CAPACITY", DEFAULT_QUEUE_CAPACITY));
        executor.setThreadNamePrefix("log-appender-");
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
