package com.hanghai.kchtg.admin.repository;

import com.hanghai.kchtg.admin.entity.AdminRecoveryToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link AdminRecoveryToken}.
 */
public interface AdminRecoveryTokenRepository extends JpaRepository<AdminRecoveryToken, UUID> {

    /**
     * T́m token chua sử dụng theo token string.
     */
    Optional<AdminRecoveryToken> findByTokenAndUsedFalse(String token);

    /**
     * Tìm tất cả token chưa sử dụng của một admin.
     */
    List<AdminRecoveryToken> findByAdminIdAndUsedFalse(UUID adminId);

    /**
     * Kiểm tra token còn hạn.
     */
    boolean existsByTokenAndUsedFalseAndExpiresAtAfter(String token, LocalDateTime now);

    /**
     * Xóa token đã sử dụng.
     */
    @Modifying
    @Query("DELETE FROM AdminRecoveryToken t WHERE t.used = true")
    int deleteUsedTokens();

    /**
     * Xóa token hết hạn.
     */
    @Modifying
    @Query("DELETE FROM AdminRecoveryToken t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Xóa tất cả token của một admin.
     */
    void deleteByAdminId(UUID adminId);
}