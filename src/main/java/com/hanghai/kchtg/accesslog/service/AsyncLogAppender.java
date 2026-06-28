package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Async batch log appender.
 * <p>
 * Receives log entries from the interceptor and batches them into the database
 * via a background thread. Uses a bounded {@link BlockingQueue} with a
 * {@link java.util.concurrent.CallerRunsPolicy} fallback when the queue is full.
 * </p>
 */
@Service
public class AsyncLogAppender {

    private static final Logger log = LoggerFactory.getLogger(AsyncLogAppender.class);

    private final AccessLogRepository repository;
    private final BlockingQueue<AccessLog> queue;
    private final int batchSize;

    public AsyncLogAppender(AccessLogRepository repository) {
        this.repository = repository;
        this.queue = new LinkedBlockingQueue<>(5000);
        this.batchSize = 100;
        startConsumer();
    }

    /**
     * Queue a single log entry for async batch insertion.
     * <p>
     * If the queue is full, falls back to synchronous write with a warning.
     * </p>
     */
    public void queue(AccessLog logEntry) {
        boolean offered = queue.offer(logEntry);
        if (!offered) {
            // Queue full — fallback to synchronous write
            log.warn("Log appender queue full (5000); falling back to sync write");
            try {
                repository.save(logEntry);
            } catch (Exception e) {
                log.error("Failed to save log entry synchronously: {}", e.getMessage());
            }
        }
    }

    /**
     * Start a background consumer that drains the queue in batches.
     */
    private void startConsumer() {
        Thread consumer = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    List<AccessLog> batch = new ArrayList<>();
                    // Drain up to batchSize entries from the queue
                    queue.drainTo(batch, batchSize);
                    if (!batch.isEmpty()) {
                        repository.saveAll(batch);
                        log.debug("Batch saved: {} entries", batch.size());
                    } else {
                        // Wait for new entries or interrupt
                        AccessLog entry = queue.poll(2, java.util.concurrent.TimeUnit.SECONDS);
                        if (entry != null) {
                            batch.add(entry);
                            repository.saveAll(batch);
                            log.debug("Batch saved: 1 entry");
                        }
                    }
                } catch (InterruptedException e) {
                    log.info("Log appender consumer interrupted");
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    log.error("Error in log appender consumer: {}", e.getMessage());
                }
            }
        }, "log-appender-consumer");
        consumer.setDaemon(true);
        consumer.start();
    }
}
