package com.hanghai.kchtg.lockout.service;

import com.hanghai.kchtg.lockout.entity.LockoutPolicy;
import com.hanghai.kchtg.lockout.dto.LockoutPolicyResponse;
import com.hanghai.kchtg.lockout.repository.LockoutPolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Lockout policy management service (F-277).
 */
@Service
public class LockoutPolicyService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LockoutPolicyService.class);
    private static final Long POLICY_ID = 1L;

    private final LockoutPolicyRepository policyRepo;

    public LockoutPolicyService(LockoutPolicyRepository policyRepo) {
        this.policyRepo = policyRepo;
    }

    /**
     * Get the current lockout policy (cached).
     */
    @Cacheable(value = "lockoutPolicy", key = "'admin'")
    public LockoutPolicy getPolicy() {
        return policyRepo.findById(POLICY_ID).orElseGet(() -> createDefault());
    }

    /**
     * Update the singleton lockout policy and evict cache.
     */
    @CacheEvict(value = "lockoutPolicy", allEntries = true)
    @Transactional
    public LockoutPolicy updatePolicy(LockoutPolicy updates) {
        LockoutPolicy existing = getPolicy();
        if (updates.getMaxFailedAttempts() > 0) existing.setMaxFailedAttempts(updates.getMaxFailedAttempts());
        if (updates.getLockoutDurationMinutes() > 0) existing.setLockoutDurationMinutes(updates.getLockoutDurationMinutes());
        if (updates.getWindowMinutes() > 0) existing.setWindowMinutes(updates.getWindowMinutes());
        existing.setEnabled(updates.isEnabled());
        existing.setUpdatedAt(LocalDateTime.now());
        return policyRepo.save(existing);
    }

    /**
     * Map entity to DTO response.
     */
    public LockoutPolicyResponse toResponse(LockoutPolicy policy) {
        LockoutPolicyResponse r = new LockoutPolicyResponse();
        r.setId(policy.getId());
        r.setMaxFailedAttempts(policy.getMaxFailedAttempts());
        r.setLockoutDurationMinutes(policy.getLockoutDurationMinutes());
        r.setWindowMinutes(policy.getWindowMinutes());
        r.setEnabled(policy.isEnabled());
        return r;
    }

    /**
     * Create default lockout policy (fallback).
     */
    private LockoutPolicy createDefault() {
        LockoutPolicy p = new LockoutPolicy();
        p.setId(POLICY_ID);
        return p;
    }

    /**
     * Ensure default lockout policy is seeded on startup.
     */
    @Override
    public void run(String... args) throws Exception {
        if (!policyRepo.existsById(POLICY_ID)) {
            LockoutPolicy p = createDefault();
            policyRepo.save(p);
            log.info("Default lockout policy seeded");
        }
    }
}