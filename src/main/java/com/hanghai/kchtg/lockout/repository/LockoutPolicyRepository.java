package com.hanghai.kchtg.lockout.repository;

import com.hanghai.kchtg.lockout.entity.LockoutPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
/**
 * Repository for LockoutPolicy entity (F-277).
 */
public interface LockoutPolicyRepository extends JpaRepository<LockoutPolicy, Long> {
}