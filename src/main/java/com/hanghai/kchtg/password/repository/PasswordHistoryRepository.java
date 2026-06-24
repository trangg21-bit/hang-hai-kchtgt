package com.hanghai.kchtg.password.repository;

import com.hanghai.kchtg.password.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Repository for PasswordHistory entity (F-276).
 */
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, UUID> {

    /**
     * Derived query to find all password history entries for a user ordered by creation time descending.
     */
    List<PasswordHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Find the top N most recent password hashes for a user (descending by created_at).
     */
    default List<PasswordHistory> findTopNByUserIdOrderByCreatedAtDesc(UUID userId, int limit) {
        return findByUserIdOrderByCreatedAtDesc(userId).stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    long countByUserId(UUID userId);

    void deleteByUserIdAndIdNotIn(UUID userId, List<UUID> keepIds);
}