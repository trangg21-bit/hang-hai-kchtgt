package com.hanghai.kchtg.cangben.service.shared;

import com.hanghai.kchtg.common.entity.AuditLog;
import com.hanghai.kchtg.common.entity.AuditLogRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Audit log service — writes records to the audit_log table within
 * the same @Transactional boundary as entity mutations.
 * <p>
 * Centralizes audit logging across all CangBen entities.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Write an audit log entry for the given action.
     *
     * @param userId   user performing the action
     * @param action   action description (e.g. "CANG_BIEN_CREATE")
     * @param detail   human-readable detail
     * @param ipAddress optional IP address (null if unavailable)
     */
    @Transactional
    public void writeAuditLog(String userId, String action, String detail, String ipAddress) {
        AuditLog entry = new AuditLog();
        entry.setUserId(userId);
        entry.setAction(action);
        entry.setDetail(detail);
        entry.setIpAddress(ipAddress);
        auditLogRepository.save(entry);
        log.debug("Audit log written: user={}, action={}", userId, action);
    }

    /**
     * Write an audit log entry with JSON metadata.
     *
     * @param userId   user performing the action
     * @param action   action description
     * @param detail   human-readable detail
     * @param metadata JSON metadata string (optional, null = no metadata)
     * @param ipAddress optional IP address
     */
    @Transactional
    public void writeAuditLog(String userId, String action, String detail,
                               String metadata, String ipAddress) {
        AuditLog entry = new AuditLog();
        entry.setUserId(userId);
        entry.setAction(action);
        entry.setDetail(detail);
        entry.setMetadata(metadata);
        entry.setIpAddress(ipAddress);
        auditLogRepository.save(entry);
        log.debug("Audit log written: user={}, action={}, metadata={}", userId, action, metadata);
    }
}
