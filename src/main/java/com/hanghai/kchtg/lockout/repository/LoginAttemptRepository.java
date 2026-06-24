package com.hanghai.kchtg.lockout.repository;

import com.hanghai.kchtg.lockout.entity.LoginAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for LoginAttempt entity.
 */
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, UUID> {

    /**
     * Count failed login attempts for a user after a given time.
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.userId = :userId AND la.result = 'FAILURE' AND la.createdAt > :since")
    long countFailuresAfter(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    /**
     * Count failed login attempts by username after a given time.
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.username = :username AND la.result = 'FAILURE' AND la.createdAt > :since")
    long countFailuresByUsername(@Param("username") String username, @Param("since") LocalDateTime since);

    /**
     * Find recent attempts for a user.
     */
    List<LoginAttempt> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Find top N recent attempts for a user.
     */
    default List<LoginAttempt> findByUserIdOrderByCreatedAtDesc(UUID userId, int limit) {
        return findByUserIdOrderByCreatedAtDesc(userId).stream()
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Paginated login attempt logs with filters.
     */
    @Query("SELECT la FROM LoginAttempt la WHERE (:userId IS NULL OR la.userId = :userId) " +
           "AND (:username IS NULL OR la.username LIKE %:username%) " +
           "AND (:result IS NULL OR la.result = :result) " +
           "AND (:since IS NULL OR la.createdAt >= :since) " +
           "ORDER BY la.createdAt DESC")
    Page<LoginAttempt> findByFilters(
        @Param("userId") UUID userId,
        @Param("username") String username,
        @Param("result") String result,
        @Param("since") LocalDateTime since,
        Pageable pageable
    );
}