package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.entity.LoginAttemptType;
import com.hanghai.kchtg.user.entity.LoginAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link LoginAuditLog}.
 */
public interface LoginAuditLogRepository extends JpaRepository<LoginAuditLog, UUID> {

    /**
     * Tim cac log attempt theo user.
     */
    List<LoginAuditLog> findByUserIdOrderByAttemptedAtDesc(UUID userId);

    /**
     * Tim cac log attempt theo username (de tra cir ngay khi user da bi xoa).
     */
    List<LoginAuditLog> findByUsernameOrderByAttemptedAtDesc(String username);

    /**
     * Dem so lan that bai trong khoang thoi gian cho truoc (de tinh account lock).
     */
    long countByUserIdAndAttemptedAtBetweenAndResult(UUID userId, LocalDateTime since, LocalDateTime until, LoginAttemptResult result);

    /**
     * Dem so lan that bai CREDENTIALS theo username trong khoang thoi gian.
     */
    long countByUsernameAndAttemptTypeAndResultAndAttemptedAtAfter(String username, LoginAttemptType attemptType, LoginAttemptResult result, LocalDateTime since);

    /**
     * Xoa log cu (garbage collection) - giu lai toi da 90 ngay.
     */
    void deleteByAttemptedAtBefore(LocalDateTime cutoff);
}