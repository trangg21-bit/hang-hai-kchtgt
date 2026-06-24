package com.hanghai.kchtg.password.repository;

import com.hanghai.kchtg.password.entity.PasswordExpirationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

/**
 * Repository for PasswordExpirationLog entity (F-276).
 */
public interface PasswordExpirationLogRepository extends JpaRepository<PasswordExpirationLog, UUID> {

    boolean existsByUserIdAndStatus(UUID userId, String status);
}