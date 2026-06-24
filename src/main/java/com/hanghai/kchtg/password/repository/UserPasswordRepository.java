package com.hanghai.kchtg.password.repository;

import com.hanghai.kchtg.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Extended repository for User entity - password-related queries.
 */
public interface UserPasswordRepository extends JpaRepository<User, UUID> {

    /**
     * Find users whose password will expire within the next 7 days.
     */
    @Query("SELECT u FROM User u WHERE u.expiresAt IS NOT NULL " +
           "AND u.expiresAt BETWEEN :now AND :sevenDaysLater " +
           "AND u.status = 'ACTIVE'")
    List<User> findExpiringSoon(@Param("now") LocalDateTime now, @Param("sevenDaysLater") LocalDateTime sevenDaysLater);

    /**
     * Find users whose password has already expired.
     */
    @Query("SELECT u FROM User u WHERE u.expiresAt IS NOT NULL " +
           "AND u.expiresAt < :now " +
           "AND u.status = 'ACTIVE'")
    List<User> findExpired(@Param("now") LocalDateTime now);

    /**
     * Find users whose password expires within N days.
     */
    @Query("SELECT u FROM User u WHERE u.expiresAt IS NOT NULL " +
           "AND u.expiresAt BETWEEN :now AND :until " +
           "AND u.status = 'ACTIVE'")
    List<User> findExpiringBefore(@Param("now") LocalDateTime now, @Param("until") LocalDateTime until);
}