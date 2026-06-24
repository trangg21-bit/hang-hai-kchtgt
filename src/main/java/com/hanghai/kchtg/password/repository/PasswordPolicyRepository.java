package com.hanghai.kchtg.password.repository;

import com.hanghai.kchtg.password.entity.PasswordPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

/**
 * Repository for PasswordPolicy entity (F-276).
 */
public interface PasswordPolicyRepository extends JpaRepository<PasswordPolicy, UUID> {
}