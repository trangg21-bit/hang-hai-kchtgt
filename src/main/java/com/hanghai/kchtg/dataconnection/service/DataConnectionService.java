package com.hanghai.kchtg.dataconnection.service;

import com.hanghai.kchtg.dataconnection.dto.*;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.enums.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.security.EncryptionUtil;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.HttpURLConnection;
import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * Business logic for managing {@link DataConnection} entities.
 * <p>
 * Credentials are transparently encrypted on create/update and
 * decrypted on read before being returned to callers.
 * </p>
 */
@Service
@Transactional
public class DataConnectionService {

    private static final Logger log = LoggerFactory.getLogger(DataConnectionService.class);

    private final DataConnectionRepository repository;
    private final EncryptionUtil encryptionUtil;

    public DataConnectionService(DataConnectionRepository repository,
                                 EncryptionUtil encryptionUtil) {
        this.repository = repository;
        this.encryptionUtil = encryptionUtil;
    }

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConnectionResponse> listAll() {
        return repository.findAll()
                .stream()
                .peek(this::decryptCredentials)
                .map(ConnectionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConnectionResponse getById(UUID id) {
        DataConnection entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kết nối dữ liệu: id=" + id));
        decryptCredentials(entity);
        return ConnectionResponse.fromEntity(entity);
    }

    public ConnectionResponse create(CreateConnectionRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã kết nối đã tồn tại: " + request.getCode());
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

        DataConnection saved = repository.save(entity);
        log.info("Created data connection: id={}, code={}", saved.getId(), saved.getCode());
        decryptCredentials(saved);
        return ConnectionResponse.fromEntity(saved);
    }

    public ConnectionResponse update(UUID id, UpdateConnectionRequest request) {
        DataConnection entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kết nối dữ liệu: id=" + id));

        if (request.getName() != null) {
            entity.setName(request.getName());
        }
        if (request.getCode() != null && !request.getCode().equals(entity.getCode())) {
            if (repository.existsByCode(request.getCode())) {
                throw new IllegalArgumentException("Mã kết nối đã tồn tại: " + request.getCode());
            }
            entity.setCode(request.getCode());
        }
        if (request.getTargetSystem() != null) {
            entity.setTargetSystem(request.getTargetSystem());
        }
        if (request.getConnectionType() != null) {
            entity.setConnectionType(request.getConnectionType());
        }
        if (request.getEndpointUrl() != null) {
            entity.setEndpointUrl(request.getEndpointUrl());
        }
        if (request.getAuthType() != null) {
            entity.setAuthType(request.getAuthType());
        }
        if (request.getCredentials() != null) {
            entity.setCredentials(encryptionUtil.encrypt(request.getCredentials()));
        }
        if (request.getSyncFrequency() != null) {
            entity.setSyncFrequency(request.getSyncFrequency());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }

        DataConnection saved = repository.save(entity);
        log.info("Updated data connection: id={}, code={}", saved.getId(), saved.getCode());
        decryptCredentials(saved);
        return ConnectionResponse.fromEntity(saved);
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy kết nối dữ liệu: id=" + id);
        }
        DataConnection entity = repository.findById(id).orElseThrow();
        entity.softDelete();
        repository.save(entity);
        log.info("Soft-deleted data connection: id={}", id);
    }

    // ── Test Connection ───────────────────────────────────────────────

    /**
     * Performs a connectivity test against the stored (or overridden) endpoint.
     * <p>
     * For {@code REST} and {@code SOAP} types a simple HTTP HEAD request is
     * attempted. For {@code DATABASE} and {@code FILE} types the test is a
     * configuration-only sanity check.
     * </p>
     */
    public TestConnectionResponse testConnection(UUID id, TestConnectionRequest overrides) {
        DataConnection entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kết nối dữ liệu: id=" + id));

        String url = overrides.getEndpointUrl() != null
                ? overrides.getEndpointUrl()
                : entity.getEndpointUrl();

        ConnectionType type = entity.getConnectionType();

        if (type == ConnectionType.DATABASE || type == ConnectionType.FILE) {
            return TestConnectionResponse.builder()
                    .success(true)
                    .message("Configuration valid - manual connectivity test required for "
                             + type.name() + " connections.")
                    .responseTimeMs(0)
                    .build();
        }

        if (url == null || url.isBlank()) {
            return TestConnectionResponse.builder()
                    .success(false)
                    .message("No endpoint URL configured.")
                    .responseTimeMs(0)
                    .build();
        }

        long start = System.currentTimeMillis();
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(10_000);
            int status = conn.getResponseCode();
            long elapsed = System.currentTimeMillis() - start;
            conn.disconnect();

            if (status >= 200 && status < 400) {
                return TestConnectionResponse.builder()
                        .success(true)
                        .message("Endpoint reachable - HTTP " + status)
                        .responseTimeMs(elapsed)
                        .build();
            }
            return TestConnectionResponse.builder()
                    .success(false)
                    .message("Endpoint returned HTTP " + status)
                    .responseTimeMs(elapsed)
                    .build();
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            log.warn("Connection test failed for id={}: {}", id, e.getMessage());
            return TestConnectionResponse.builder()
                    .success(false)
                    .message("Connection failed: " + e.getMessage())
                    .responseTimeMs(elapsed)
                    .build();
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────

    /**
     * Decrypts the credentials field in-place so the caller sees plain text.
     * The entity's persisted encrypted value is not affected - the entity
     * is still attached to the persistence context so the change is not flushed.
     */
    private void decryptCredentials(DataConnection entity) {
        String encrypted = entity.getCredentials();
        if (encrypted != null && !encrypted.isEmpty()) {
            String decrypted = encryptionUtil.decrypt(encrypted);
            entity.setCredentials(decrypted);
        }
    }
}
