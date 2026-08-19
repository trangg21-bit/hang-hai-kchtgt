package com.hanghai.kchtg.fieldvisibility.service;

import com.hanghai.kchtg.fieldvisibility.entity.FieldPolicy;
import com.hanghai.kchtg.fieldvisibility.entity.FieldTargetType;
import com.hanghai.kchtg.fieldvisibility.entity.SystemFieldCatalog;
import com.hanghai.kchtg.fieldvisibility.repository.FieldPolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.UUID;

/**
 * Service managing FieldPolicy CRUD operations, strict SystemFieldCatalog
 * validation,
 * and AFTER_COMMIT cache invalidation.
 */
@Service
public class FieldPolicyService {

    private final FieldPolicyRepository fieldPolicyRepository;
    private final FieldVisibilityService fieldVisibilityService;

    public FieldPolicyService(FieldPolicyRepository fieldPolicyRepository,
            FieldVisibilityService fieldVisibilityService) {
        this.fieldPolicyRepository = fieldPolicyRepository;
        this.fieldVisibilityService = fieldVisibilityService;
    }

    public List<FieldPolicy> findAll() {
        return fieldPolicyRepository.findAll();
    }

    public List<FieldPolicy> findActive() {
        return fieldVisibilityService.getActivePolicies();
    }

    @Transactional
    public FieldPolicy create(FieldPolicy policy) {
        validatePolicy(policy);
        FieldPolicy saved = fieldPolicyRepository.save(policy);
        evictCacheAfterCommit();
        return saved;
    }

    @Transactional
    public FieldPolicy update(UUID id, FieldPolicy updates) {
        FieldPolicy existing = fieldPolicyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chính sách phân quyền với ID: " + id));

        validatePolicy(updates);
        existing.setSubjectType(updates.getSubjectType());
        existing.setSubjectId(updates.getSubjectId());
        existing.setResource(updates.getResource());
        existing.setTargetType(updates.getTargetType());
        existing.setTargetKey(updates.getTargetKey());
        existing.setEffect(updates.getEffect());
        existing.setPriority(updates.getPriority());
        existing.setActive(updates.isActive());

        FieldPolicy saved = fieldPolicyRepository.save(existing);
        evictCacheAfterCommit();
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        FieldPolicy existing = fieldPolicyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chính sách phân quyền với ID: " + id));
        fieldPolicyRepository.delete(existing);
        evictCacheAfterCommit();
    }

    @Transactional
    public void toggleActive(UUID id, boolean active) {
        FieldPolicy existing = fieldPolicyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chính sách phân quyền với ID: " + id));
        existing.setActive(active);
        fieldPolicyRepository.save(existing);
        evictCacheAfterCommit();
    }

    /**
     * Evict policy cache safely AFTER_COMMIT to prevent cache/DB desync if
     * transaction rolls back.
     */
    private void evictCacheAfterCommit() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    fieldVisibilityService.evictPolicyCache();
                }
            });
        } else {
            fieldVisibilityService.evictPolicyCache();
        }
    }

    private void validatePolicy(FieldPolicy policy) {
        if (policy == null) {
            throw new IllegalArgumentException("Chính sách phân quyền không được để trống");
        }
        if (policy.getResource() == null || policy.getResource().isBlank()) {
            throw new IllegalArgumentException("Tài nguyên (resource) không được để trống");
        }
        if (policy.getTargetKey() == null || policy.getTargetKey().isBlank()) {
            throw new IllegalArgumentException("Trường mục tiêu (targetKey) không được để trống");
        }
    }
}
