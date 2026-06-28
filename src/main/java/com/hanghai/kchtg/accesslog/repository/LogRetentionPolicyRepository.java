package com.hanghai.kchtg.accesslog.repository;

import com.hanghai.kchtg.accesslog.entity.LogRetentionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

/**
 * JPA repository for {@link LogRetentionPolicy} entities.
 */
public interface LogRetentionPolicyRepository extends JpaRepository<LogRetentionPolicy, Long> {

    /** Find the active retention policy (singleton). */
    @Query("SELECT l FROM LogRetentionPolicy l WHERE l.isActive = true ORDER BY l.id DESC LIMIT 1")
    Optional<LogRetentionPolicy> findActive();
}
