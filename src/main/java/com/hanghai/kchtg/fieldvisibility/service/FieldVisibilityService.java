package com.hanghai.kchtg.fieldvisibility.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.entity.FieldPolicy;
import com.hanghai.kchtg.fieldvisibility.entity.FieldSubjectType;
import com.hanghai.kchtg.fieldvisibility.entity.FieldTargetType;
import com.hanghai.kchtg.fieldvisibility.repository.FieldPolicyRepository;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.security.service.EffectivePermissionService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Field-level authorization resolver (M-1004 PoC).
 * <p>
 * Implements the normative resolution algorithm: for the current user and a
 * feature
 * resource, computes the effective per-field effect (HIDE | READONLY | default
 * ALLOW).
 * Uses distributed Redis cache for active field policies with resilient
 * fallback.
 * </p>
 */
@Service
public class FieldVisibilityService {

    private static final Logger log = LoggerFactory.getLogger(FieldVisibilityService.class);
    private static final String WILDCARD = "*";
    private static final String ADMIN_ALL = "admin:all";
    private static final String REDIS_KEY_FIELD_POLICIES = "field_policies:active";
    private static final long REDIS_TTL_MINUTES = 30;

    private final FieldPolicyRepository fieldPolicyRepository;
    private final ObjectMapper objectMapper;
    private StringRedisTemplate redisTemplate;
    private EffectivePermissionService effectivePermissionService;

    public FieldVisibilityService(FieldPolicyRepository fieldPolicyRepository) {
        this.fieldPolicyRepository = fieldPolicyRepository;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Autowired(required = false)
    public void setStringRedisTemplate(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Autowired(required = false)
    public void setEffectivePermissionService(EffectivePermissionService effectivePermissionService) {
        this.effectivePermissionService = effectivePermissionService;
    }

    /**
     * Backward-compatible setter for legacy test mocks.
     */
    @Autowired(required = false)
    public void setPermissionCacheService(PermissionCacheService permissionCacheService) {
        // Kept for backward-compatibility with tests that mock PermissionCacheService
        // directly
    }

    /**
     * Active policies cache. Distributed via Redis with database fallback.
     */
    public List<FieldPolicy> getActivePolicies() {
        if (redisTemplate != null) {
            try {
                String json = redisTemplate.opsForValue().get(REDIS_KEY_FIELD_POLICIES);
                if (json != null && !json.isBlank()) {
                    return objectMapper.readValue(json, new TypeReference<List<FieldPolicy>>() {
                    });
                }
            } catch (Exception e) {
                log.debug("Redis field policies cache read failed: {}", e.getMessage());
            }
        }

        List<FieldPolicy> policies = fieldPolicyRepository.findByActiveTrue();

        if (redisTemplate != null && policies != null) {
            try {
                String json = objectMapper.writeValueAsString(policies);
                redisTemplate.opsForValue().set(REDIS_KEY_FIELD_POLICIES, json, REDIS_TTL_MINUTES, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.debug("Redis field policies cache write failed: {}", e.getMessage());
            }
        }
        return policies != null ? policies : Collections.emptyList();
    }

    /**
     * Invalidate active policy cache in distributed Redis.
     */
    public void evictPolicyCache() {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(REDIS_KEY_FIELD_POLICIES);
            } catch (Exception e) {
                log.warn("Redis field policies cache eviction failed: {}", e.getMessage());
            }
        }
    }

    /**
     * Resolve the effective per-field effect for the user on the resource.
     * Absent field == ALLOW. Structural admin bypass returns an empty map.
     */
    public Map<String, FieldEffect> resolve(User user, String resource) {
        if (user == null) {
            return Map.of();
        }

        Set<String> permissions = effectivePermissionService == null
                ? user.getAllPermissions()
                : effectivePermissionService.getEffectivePermissions(user);
        if (permissions.contains(ADMIN_ALL) || permissions.contains(WILDCARD)) {
            return Map.of();
        }

        Set<Subject> subjects = buildSubjectSet(user, permissions);
        String normalizedResource = normalizeResource(resource);

        List<FieldPolicy> rules = getActivePolicies();

        Map<String, Candidate> winners = new LinkedHashMap<>();
        for (FieldPolicy rule : rules) {
            if (!matchesResource(rule, normalizedResource)) {
                continue;
            }
            if (!subjects.contains(Subject.of(rule.getSubjectType(), rule.getSubjectId()))) {
                continue;
            }
            String key = (rule.getTargetType() == FieldTargetType.ALL) ? WILDCARD : rule.getTargetKey();
            int resourceSpec = WILDCARD.equals(rule.getResource()) ? 0 : 1;
            String tieBreakerKey = rule.getId() != null ? rule.getId().toString() : "";
            Candidate candidate = new Candidate(
                    rule.getEffect(),
                    subjectSpecificity(rule.getSubjectType()),
                    targetSpecificity(rule.getTargetType()),
                    resourceSpec,
                    rule.getPriority(),
                    tieBreakerKey);
            Candidate current = winners.get(key);
            if (current == null || beats(candidate, current)) {
                winners.put(key, candidate);
            }
        }

        Map<String, FieldEffect> result = new LinkedHashMap<>();
        winners.forEach((field, candidate) -> result.put(field, candidate.effect()));
        return result;
    }

    /**
     * Visibility map for the controller: only HIDE/READONLY entries, values are
     * the enum names. Absent field == ALLOW.
     */
    public Map<String, String> getVisibilityMap(User user, String resource) {
        Map<String, FieldEffect> resolved = resolve(user, resource);
        Map<String, String> result = new LinkedHashMap<>();
        resolved.forEach((field, effect) -> result.put(field, effect.name()));
        return result;
    }

    private Set<Subject> buildSubjectSet(User user, Set<String> permissions) {
        Set<Subject> subjects = new HashSet<>();
        if (user.getId() != null) {
            subjects.add(Subject.of(FieldSubjectType.USER, user.getId().toString()));
        }
        if (user.getGroups() != null) {
            for (UserGroup group : user.getGroups()) {
                if (group != null
                        && (group.getStatus() == null || group.getStatus() == GroupStatus.ACTIVE)) {
                    subjects.add(Subject.of(FieldSubjectType.GROUP, group.getId().toString()));
                }
            }
        }
        for (String code : permissions) {
            subjects.add(Subject.of(FieldSubjectType.PERMISSION, code));
        }
        return subjects;
    }

    private boolean matchesResource(FieldPolicy rule, String resource) {
        if (rule.getResource() == null) {
            return false;
        }
        if (WILDCARD.equals(rule.getResource())) {
            return true;
        }
        return rule.getResource().equals(resource);
    }

    private String normalizeResource(String resource) {
        return (resource == null) ? null : resource.trim().toLowerCase(Locale.ROOT);
    }

    private int subjectSpecificity(FieldSubjectType type) {
        return switch (type) {
            case PERMISSION -> 0;
            case GROUP -> 1;
            case USER -> 2;
        };
    }

    private int targetSpecificity(FieldTargetType type) {
        return switch (type) {
            case ALL -> 0;
            case GROUP -> 1;
            case FIELD -> 2;
        };
    }

    private int effectRank(FieldEffect effect) {
        if (effect == null)
            return 0;
        return switch (effect) {
            case HIDE -> 2;
            case READONLY -> 1;
            case ALLOW -> 0;
        };
    }

    private boolean beats(Candidate candidate, Candidate current) {
        if (candidate.subjectSpecificity() != current.subjectSpecificity()) {
            return candidate.subjectSpecificity() > current.subjectSpecificity();
        }
        if (candidate.targetSpecificity() != current.targetSpecificity()) {
            return candidate.targetSpecificity() > current.targetSpecificity();
        }
        if (candidate.resourceSpecificity() != current.resourceSpecificity()) {
            return candidate.resourceSpecificity() > current.resourceSpecificity();
        }
        if (candidate.priority() != current.priority()) {
            return candidate.priority() > current.priority();
        }
        // Tie-Breaker 1: Least privilege / Most restrictive effect wins
        if (candidate.effect() != current.effect()) {
            return effectRank(candidate.effect()) > effectRank(current.effect());
        }
        // Tie-Breaker 2: Stable deterministic ID key ordering
        return candidate.tieBreakerKey().compareTo(current.tieBreakerKey()) > 0;
    }

    private record Subject(FieldSubjectType type, String id) {
        static Subject of(FieldSubjectType type, String id) {
            String normalized = (id == null) ? "" : id.trim().toLowerCase(Locale.ROOT);
            return new Subject(type, normalized);
        }
    }

    private record Candidate(
            FieldEffect effect,
            int subjectSpecificity,
            int targetSpecificity,
            int resourceSpecificity,
            int priority,
            String tieBreakerKey) {
    }
}
