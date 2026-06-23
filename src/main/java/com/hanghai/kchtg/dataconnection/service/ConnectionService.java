package com.hanghai.kchtg.dataconnection.service;

import com.hanghai.kchtg.dataconnection.dto.ConnectionResponse;
import com.hanghai.kchtg.dataconnection.dto.CreateConnectionRequest;
import com.hanghai.kchtg.dataconnection.dto.TestConnectionRequest;
import com.hanghai.kchtg.dataconnection.dto.TestConnectionResponse;
import com.hanghai.kchtg.dataconnection.dto.UpdateConnectionRequest;
import com.hanghai.kchtg.dataconnection.entity.ConnectionHealth;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.enums.AuthType;
import com.hanghai.kchtg.dataconnection.enums.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.repository.ConnectionHealthRepository;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.security.EncryptionUtil;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.HttpURLConnection;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service quan ly data connection voi health check, retry policy và exponential backoff.
 */
@Service
public class ConnectionService {

    private static final Logger log = LoggerFactory.getLogger(ConnectionService.class);

    private static final int MAX_RETRIES = 3;
    private static final long BASE_DELAY_MS = 1000;
    private static final long MAX_DELAY_MS = 30000;

    private final DataConnectionRepository repo;
    private final EncryptionUtil encryptionUtil;
    private final ConnectionHealthRepository healthRepo;
    private final SyncLogRepository syncLogRepo;

    public ConnectionService(DataConnectionRepository repo,
                             EncryptionUtil encryptionUtil,
                             ConnectionHealthRepository healthRepo,
                             SyncLogRepository syncLogRepo) {
        this.repo = repo;
        this.encryptionUtil = encryptionUtil;
        this.healthRepo = healthRepo;
        this.syncLogRepo = syncLogRepo;
    }

    // ── CRUD ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConnectionResponse> listAll() {
        return repo.findAll().stream()
                .peek(this::decryptCredentials)
                .map(ConnectionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConnectionResponse getById(UUID id) {
        DataConnection entity = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Data connection not found: id=" + id));
        decryptCredentials(entity);
        return ConnectionResponse.fromEntity(entity);
    }

    public ConnectionResponse create(CreateConnectionRequest request) {
        if (repo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Connection code already exists: " + request.getCode());
        }
        DataConnection entity = new DataConnection();
        entity.setName(request.getName());
        entity.setCode(request.getCode());
        entity.setTargetSystem(request.getTargetSystem());
        entity.setConnectionType(request.getConnectionType());
        entity.setEndpointUrl(request.getEndpointUrl());
        entity.setAuthType(request.getAuthType());
        entity.setCredentials(encryptionUtil.encrypt(request.getCredentials()));
        entity.setSyncFrequency(request.getSyncFrequency());
        entity.setStatus(ConnectionStatus.INACTIVE);
        DataConnection saved = repo.save(entity);
        log.info("Created data connection: id={}, code={}", saved.getId(), saved.getCode());
        decryptCredentials(saved);
        return ConnectionResponse.fromEntity(saved);
    }

    public ConnectionResponse update(UUID id, UpdateConnectionRequest request) {
        DataConnection entity = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Data connection not found: id=" + id));
        if (request.getName() != null) entity.setName(request.getName());
        if (request.getCode() != null && !request.getCode().equals(entity.getCode())) {
            if (repo.existsByCode(request.getCode())) {
                throw new IllegalArgumentException("Connection code already exists: " + request.getCode());
            }
            entity.setCode(request.getCode());
        }
        if (request.getTargetSystem() != null) entity.setTargetSystem(request.getTargetSystem());
        if (request.getConnectionType() != null) entity.setConnectionType(request.getConnectionType());
        if (request.getEndpointUrl() != null) entity.setEndpointUrl(request.getEndpointUrl());
        if (request.getAuthType() != null) entity.setAuthType(request.getAuthType());
        if (request.getCredentials() != null) entity.setCredentials(encryptionUtil.encrypt(request.getCredentials()));
        if (request.getSyncFrequency() != null) entity.setSyncFrequency(request.getSyncFrequency());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        DataConnection saved = repo.save(entity);
        log.info("Updated data connection: id={}, code={}", saved.getId(), saved.getCode());
        decryptCredentials(saved);
        return ConnectionResponse.fromEntity(saved);
    }

    public void delete(UUID id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Data connection not found: id=" + id);
        }
        DataConnection entity = repo.findById(id).orElseThrow();
        entity.softDelete();
        repo.save(entity);
        log.info("Soft-deleted data connection: id={}", id);
    }

    // ── Health Check + Retry + Exponential Backoff ───────────────────

    /**
     * Kiem tra suc khoe ket noi voi retry policy và exponential backoff.
     */
    @Transactional
    public ConnectionHealth healthCheck(UUID connectionId) {
        DataConnection entity = repo.findById(connectionId)
                .orElseThrow(() -> new EntityNotFoundException("Data connection not found: id=" + connectionId));

        TestConnectionResponse result = testConnectionWithRetry(entity);
        ConnectionHealth health;

        if (result.isSuccess()) {
            health = ConnectionHealth.create(connectionId, result.getResponseCode(), result.getResponseTimeMs(), null);
            entity.setStatus(ConnectionStatus.ACTIVE);
        } else {
            health = ConnectionHealth.create(connectionId, result.getResponseCode(), result.getResponseTimeMs(), result.getMessage());
            entity.setStatus(ConnectionStatus.ERROR);
        }

        repo.save(entity);
        healthRepo.save(health);
        log.info("Health check for {}: status={}, latency={}ms",
                connectionId, result.isSuccess() ? "OK" : "FAIL", result.getResponseTimeMs());
        return health;
    }

    /**
     * Test connection voi retry policy (max 3 attempts, exponential backoff).
     */
    private TestConnectionResponse testConnectionWithRetry(DataConnection entity) {
        String url = entity.getEndpointUrl();
        ConnectionType type = entity.getConnectionType();

        if (type == ConnectionType.DATABASE || type == ConnectionType.FILE) {
            return TestConnectionResponse.builder()
                    .success(true)
                    .message("Configuration valid")
                    .responseTimeMs(0L)
                    .responseCode(200)
                    .build();
        }

        if (url == null || url.isBlank()) {
            return TestConnectionResponse.builder()
                    .success(false)
                    .message("No endpoint URL configured.")
                    .responseTimeMs(0L)
                    .responseCode(0)
                    .build();
        }

        UUID connId = entity.getId();
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            long start = System.currentTimeMillis();
            try {
                HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
                conn.setRequestMethod("HEAD");
                conn.setConnectTimeout(10_000);
                conn.setReadTimeout(10_000);
                if (entity.getAuthType() == AuthType.TOKEN && entity.getCredentials() != null && !entity.getCredentials().isBlank()) {
                    conn.setRequestProperty("X-Integration-Token", entity.getCredentials().trim());
                    conn.setRequestProperty("Authorization", "Bearer " + entity.getCredentials().trim());
                }
                int status = conn.getResponseCode();
                long elapsed = System.currentTimeMillis() - start;
                conn.disconnect();

                if (status >= 200 && status < 400) {
                    return TestConnectionResponse.builder()
                            .success(true)
                            .message("Endpoint reachable — HTTP " + status)
                            .responseTimeMs(elapsed)
                            .responseCode(status)
                            .build();
                }
                return TestConnectionResponse.builder()
                        .success(false)
                        .message("Endpoint returned HTTP " + status)
                        .responseTimeMs(elapsed)
                        .responseCode(status)
                        .build();
            } catch (Exception e) {
                long elapsed = System.currentTimeMillis() - start;
                log.warn("Health check attempt {} for {}: {}", attempt, connId, e.getMessage());
                if (attempt < MAX_RETRIES) {
                    try {
                        long delay = calculateBackoff(attempt);
                        log.info("Retrying in {}ms (attempt {}/{})", delay, attempt + 1, MAX_RETRIES);
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        return TestConnectionResponse.builder()
                .success(false)
                .message("Health check failed after " + MAX_RETRIES + " retries")
                .responseTimeMs(0L)
                .responseCode(0)
                .build();
    }

    /**
     * Calculate exponential backoff delay.
     */
    private long calculateBackoff(int attempt) {
        long delay = BASE_DELAY_MS * (1L << (attempt - 1)); // 1x, 2x, 4x
        return Math.min(delay, MAX_DELAY_MS);
    }

    // ── Health History ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConnectionHealth> getHealthHistory(UUID connectionId, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return healthRepo.findByConnectionIdOrderByCheckedAtDesc(connectionId)
                .stream()
                .filter(h -> h.getCheckedAt().isAfter(since))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Double getAvgLatency(UUID connectionId) {
        return healthRepo.avgLatency(connectionId, LocalDateTime.now().minusDays(7));
    }

    // ── Internal ──────────────────────────────────────────────────────

    private void decryptCredentials(DataConnection entity) {
        String encrypted = entity.getCredentials();
        if (encrypted != null && !encrypted.isEmpty()) {
            String decrypted = encryptionUtil.decrypt(encrypted);
            entity.setCredentials(decrypted);
        }
    }
}
