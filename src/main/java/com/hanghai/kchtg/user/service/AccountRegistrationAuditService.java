package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.AccountRegistrationAudit;
import com.hanghai.kchtg.user.repository.AccountRegistrationAuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for creating audit log entries during account registration flow.
 */
@Service
public class AccountRegistrationAuditService {

    private static final Logger log = LoggerFactory.getLogger(AccountRegistrationAuditService.class);

    private final AccountRegistrationAuditRepository auditRepository;

    public AccountRegistrationAuditService(AccountRegistrationAuditRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    /**
     * Creates a SUCCESS audit entry.
     */
    @Transactional
    public void logSuccess(UUID userId, String identifier, String eventType,
                           long processingTimeMs, String ipAddress, String userAgent) {
        AccountRegistrationAudit audit = new AccountRegistrationAudit();
        audit.setUserId(userId);
        audit.setIdentifier(identifier);
        audit.setEventType(eventType);
        audit.setStatus(AccountRegistrationAudit.AuditStatus.SUCCESS);
        audit.setProcessingTimeMs(processingTimeMs);
        audit.setIpAddress(ipAddress);
        audit.setUserAgent(userAgent);

        auditRepository.save(audit);
        log.info("AUDIT [{}]: userId={}, identifier={}, processingTime={}ms",
                eventType, userId, identifier, processingTimeMs);
    }

    /**
     * Creates a FAILURE audit entry.
     */
    @Transactional
    public void logFailure(UUID userId, String identifier, String eventType,
                           String errorMessage, String ipAddress, String userAgent) {
        AccountRegistrationAudit audit = new AccountRegistrationAudit();
        audit.setUserId(userId);
        audit.setIdentifier(identifier);
        audit.setEventType(eventType);
        audit.setStatus(AccountRegistrationAudit.AuditStatus.FAILURE);
        audit.setErrorMessage(truncate(errorMessage, 500));
        audit.setIpAddress(ipAddress);
        audit.setUserAgent(userAgent);

        auditRepository.save(audit);
        log.warn("AUDIT [{}]: userId={}, identifier={}, error={}",
                eventType, userId, identifier, errorMessage);
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}
