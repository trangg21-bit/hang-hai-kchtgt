package com.hanghai.kchtg.security.repository;

import com.hanghai.kchtg.security.entity.JwtSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA repository cho {@link JwtSessionEntity}.
 */
public interface JwtSessionRepository extends JpaRepository<JwtSessionEntity, UUID> {

    /**
     * Tim session theo sessionId (unique).
     */
    Optional<JwtSessionEntity> findBySessionId(String sessionId);

    /**
     * Tim session theo refresh token hash (unique).
     */
    Optional<JwtSessionEntity> findByRefreshTokenHash(String refreshTokenHash);

    /**
     * Tim tat ca session dang active (isRevoked=false) cua user.
     */
    List<JwtSessionEntity> findByUserIdAndIsRevokedFalse(String userId);

    /**
     * Tim tat ca session (khong revoke) cua user.
     */
    List<JwtSessionEntity> findByUserIdAndIsRevoked(String userId, boolean isRevoked);

    /**
     * Dem so session active cua user.
     */
    long countByUserIdAndIsRevokedFalse(String userId);

    /**
     * Cap nhat isRevoked = true cho tat ca session cua user.
     */
    @Modifying
    @Query("UPDATE JwtSessionEntity s SET s.isRevoked = true, s.status = 'REVOKED', "
            + "s.revokedAt = CURRENT_TIMESTAMP WHERE s.userId = :userId AND s.isRevoked = false")
    int revokeAllByUserId(@Param("userId") String userId);

    /**
     * Cap nhat lastUsedAt = now cho session.
     */
    @Modifying
    @Query("UPDATE JwtSessionEntity s SET s.lastUsedAt = CURRENT_TIMESTAMP, s.updatedAt = CURRENT_TIMESTAMP "
            + "WHERE s.id = :id")
    int touchLastUsed(@Param("id") UUID id);

    /**
     * Tìm các session đã hết hạn và chưa revoked.
     */
    @Query("SELECT s FROM JwtSessionEntity s WHERE s.expiresAt < :now AND s.isRevoked = false AND s.status = 'ACTIVE'")
    List<JwtSessionEntity> findExpiredSessions(@Param("now") LocalDateTime now);

    /**
     * Dem session da het han chua revoke.
     */
    long countByExpiresAtBeforeAndIsRevokedFalse(LocalDateTime now);
}