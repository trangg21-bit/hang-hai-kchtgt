package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.PasswordResetToken;
import com.hanghai.kchtg.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link PasswordResetToken}.
 * <p>
 * BR-006: Token co thoi han 1 gio sau khi tao.
 * </p>
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /**
     * Tim token theo gia tri token duy nhat.
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Tim nhung token chua het han cua mot nguoi dung.
     * Dung de kiem tra rate-limiting tren password reset.
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user.id = :userId AND t.expiresAt > :now AND t.used = false")
    Optional<PasswordResetToken> findActiveTokenByUserId(@Param("userId") UUID userId,
                                                         @Param("now") LocalDateTime now);

    /**
     * Xoa token theo gia tri (su dung sau reset thanh cong de invalidate).
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.token = :token")
    void deleteByToken(@Param("token") String token);

    /**
     * Xoa cac token cu cua nguoi dung khi dat lai mat khau.
     */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user.id = :userId AND t.used = false")
    void markAllUnusedAsUsedByUserId(@Param("userId") UUID userId);
}
