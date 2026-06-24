package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.AccountRegistrationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link AccountRegistrationAudit}.
 */
public interface AccountRegistrationAuditRepository extends JpaRepository<AccountRegistrationAudit, UUID> {

    /**
     * Tìm các audit log theo identifier (email/phone).
     */
    List<AccountRegistrationAudit> findByIdentifierOrderByCreatedAtDesc(String identifier);

    /**
     * Tìm các audit log theo user ID.
     */
    List<AccountRegistrationAudit> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Tìm các audit log trong khoảng thời gian.
     */
    List<AccountRegistrationAudit> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    /**
     * Đếm số lần đăng ký thất bại trong khoảng thời gian (dùng cho rate limiting).
     */
    long countByIdentifierAndEventTypeAndStatusAndCreatedAtGreaterThan(String identifier, String eventType,
                                                                        AccountRegistrationAudit.AuditStatus status,
                                                                        LocalDateTime since);
}