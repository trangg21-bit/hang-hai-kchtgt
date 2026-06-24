package com.hanghai.kchtg.password.service;

import com.hanghai.kchtg.password.dto.PasswordPolicyResponse;
import com.hanghai.kchtg.password.entity.PasswordPolicy;
import com.hanghai.kchtg.password.repository.PasswordPolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Password policy service - singleton CRUD with caching (F-276).
 */
@Service
public class PasswordPolicyService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PasswordPolicyService.class);
    private static final UUID DEFAULT_UUID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final PasswordPolicyRepository policyRepository;

    public PasswordPolicyService(PasswordPolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
    }

    /**
     * Load policy from database, cache it for subsequent calls.
     */
    @Cacheable(value = "passwordPolicy", key = "'default'")
    public PasswordPolicy getPolicy() {
        return policyRepository.findById(DEFAULT_UUID).orElseGet(() -> createDefault());
    }

    /**
     * Update the singleton policy and evict the cache.
     */
    @CacheEvict(value = "passwordPolicy", key = "'default'")
    @Transactional
    public PasswordPolicy updatePolicy(PasswordPolicy updates) {
        PasswordPolicy existing = getPolicy();
        if (updates.getMinLength() > 0) existing.setMinLength(updates.getMinLength());
        if (updates.isRequireUppercase()) existing.setRequireUppercase(true);
        if (updates.isRequireLowercase()) existing.setRequireLowercase(true);
        if (updates.isRequireDigit()) existing.setRequireDigit(true);
        if (updates.isRequireSpecialChar()) existing.setRequireSpecialChar(true);
        if (updates.getSpecialCharSet() != null && !updates.getSpecialCharSet().isBlank()) {
            existing.setSpecialCharSet(updates.getSpecialCharSet());
        }
        if (updates.getMaxAgeDays() > 0) existing.setMaxAgeDays(updates.getMaxAgeDays());
        if (updates.getHistoryDepth() >= 0) existing.setHistoryDepth(updates.getHistoryDepth());
        if (updates.isBlockUsernameInPassword()) existing.setBlockUsernameInPassword(true);
        existing.setUpdatedAt(LocalDateTime.now());
        return policyRepository.save(existing);
    }

    /**
     * Map entity to DTO response.
     */
    public PasswordPolicyResponse toResponse(PasswordPolicy policy) {
        PasswordPolicyResponse r = new PasswordPolicyResponse();
        r.setId(policy.getId());
        r.setMinLength(policy.getMinLength());
        r.setRequireUppercase(policy.isRequireUppercase());
        r.setRequireLowercase(policy.isRequireLowercase());
        r.setRequireDigit(policy.isRequireDigit());
        r.setRequireSpecialChar(policy.isRequireSpecialChar());
        r.setSpecialCharSet(policy.getSpecialCharSet());
        r.setMaxAgeDays(policy.getMaxAgeDays());
        r.setHistoryDepth(policy.getHistoryDepth());
        r.setBlockUsernameInPassword(policy.isBlockUsernameInPassword());
        r.setCreatedAt(policy.getCreatedAt() != null ? policy.getCreatedAt().toString() : null);
        r.setUpdatedAt(policy.getUpdatedAt() != null ? policy.getUpdatedAt().toString() : null);
        return r;
    }

    /**
     * Create default policy entity (fallback).
     */
    private PasswordPolicy createDefault() {
        log.info("Creating default password policy (none found in DB)");
        PasswordPolicy p = new PasswordPolicy();
        p.setId(DEFAULT_UUID);
        return p;
    }

    /**
     * Ensure default policy is seeded on startup.
     */
    @Override
    public void run(String... args) throws Exception {
        if (!policyRepository.existsById(DEFAULT_UUID)) {
            PasswordPolicy p = createDefault();
            policyRepository.save(p);
            log.info("Default password policy seeded");
        }
    }
}