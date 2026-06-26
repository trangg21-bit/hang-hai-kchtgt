package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    @Query("SELECT t FROM VerificationToken t WHERE t.email = :email AND t.used = false AND t.expiresAt > :now")
    Optional<VerificationToken> findValidTokenByEmail(String email, LocalDateTime now);

    @Query("SELECT t FROM VerificationToken t WHERE t.userId = :userId AND t.used = false AND t.expiresAt > :now")
    List<VerificationToken> findValidTokensByUserId(UUID userId, LocalDateTime now);

    /**
     * Xóa các token hết hạn.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM VerificationToken t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(LocalDateTime now);

    @Query("SELECT COUNT(t) > 0 FROM VerificationToken t WHERE t.email = :email AND t.used = false AND t.expiresAt > :now")
    boolean existsValidTokenByEmail(String email, LocalDateTime now);

    @Query("SELECT t.email FROM VerificationToken t WHERE t.tokenHash = :tokenHash AND t.used = false AND t.expiresAt > :now")
    Optional<String> findEmailByTokenHash(String tokenHash, LocalDateTime now);
}
