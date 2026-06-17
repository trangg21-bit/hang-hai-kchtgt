package com.hanghai.kchtg.admin.repository;

import com.hanghai.kchtg.admin.entity.AdminRecoveryToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link AdminRecoveryToken}.
 */
@Repository
public interface AdminRecoveryTokenRepository extends JpaRepository<AdminRecoveryToken, UUID> {

    /**
     * T́m token chua s? d?ng theo token string.
     */
    Optional<AdminRecoveryToken> findByTokenAndUsedFalse(String token);

    /**
     * T́m t?t c? token chua s? d?ng c?a m?t admin.
     */
    List<AdminRecoveryToken> findByAdminIdAndUsedFalse(UUID adminId);

    /**
     * Ki?m tra token c̣n h?n.
     */
    boolean existsByTokenAndUsedFalseAndExpiresAtAfter(String token, LocalDateTime now);

    /**
     * Xóa token dă s? d?ng.
     */
    @Modifying
    @Query("DELETE FROM AdminRecoveryToken t WHERE t.used = true")
    int deleteUsedTokens();

    /**
     * Xóa token h?t h?n.
     */
    @Modifying
    @Query("DELETE FROM AdminRecoveryToken t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Xóa t?t c? token c?a m?t admin.
     */
    void deleteByAdminId(UUID adminId);
}
