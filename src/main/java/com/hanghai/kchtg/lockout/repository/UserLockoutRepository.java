package com.hanghai.kchtg.lockout.repository;

import com.hanghai.kchtg.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Extended repository for User entity - lockout-related queries.
 */
public interface UserLockoutRepository extends JpaRepository<User, UUID> {

    /**
     * Find user by username or email.
     */
    Optional<User> findByUsernameOrEmail(String username, String email);

    /**
     * Find user with pessimistic write lock (SELECT FOR UPDATE).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithPessimisticLock(@Param("id") UUID id);

    /**
     * Find users that have an active lockout that has expired (for auto-unlock).
     */
    @Query("SELECT u FROM User u WHERE u.accountLockedUntil IS NOT NULL AND u.accountLockedUntil < :now")
    List<User> findByLockedUntilNotNullAndLockedUntilBefore(@Param("now") LocalDateTime now);

    /**
     * Find all users by username for lockout lookup.
     */
    Optional<User> findByUsername(String username);

    /**
     * Find all users by email for lockout lookup.
     */
    Optional<User> findByEmail(String email);
}