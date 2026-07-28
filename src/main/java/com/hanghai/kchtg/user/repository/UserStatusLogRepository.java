package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.UserStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Repository for UserStatusLog audit entity (BR-001-07 / BR-015).
 */
public interface UserStatusLogRepository extends JpaRepository<UserStatusLog, UUID> {
}
