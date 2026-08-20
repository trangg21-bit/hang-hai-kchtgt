package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.entity.FieldPolicy;
import com.hanghai.kchtg.fieldvisibility.entity.FieldSubjectType;
import com.hanghai.kchtg.fieldvisibility.entity.FieldTargetType;
import com.hanghai.kchtg.fieldvisibility.repository.FieldPolicyRepository;
import com.hanghai.kchtg.fieldvisibility.service.FieldVisibilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FieldVisibilityDistributedCacheTest {

    @Mock
    private FieldPolicyRepository fieldPolicyRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private FieldVisibilityService service;

    @BeforeEach
    void setUp() {
        service = new FieldVisibilityService(fieldPolicyRepository);
        service.setStringRedisTemplate(redisTemplate);
    }

    @Test
    @DisplayName("Redis cache miss fetches from DB and populates Redis")
    void cacheMiss_fetchesFromDbAndPopulatesRedis() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("field_policies:active")).thenReturn(null);

        FieldPolicy policy = new FieldPolicy();
        policy.setResource("port");
        policy.setSubjectType(FieldSubjectType.PERMISSION);
        policy.setSubjectId("port:read");
        policy.setTargetType(FieldTargetType.FIELD);
        policy.setTargetKey("securityLevel");
        policy.setEffect(FieldEffect.READONLY);
        policy.setActive(true);

        when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(policy));

        List<FieldPolicy> result = service.getActivePolicies();

        assertEquals(1, result.size());
        assertEquals("port", result.get(0).getResource());
        verify(valueOperations).set(eq("field_policies:active"), anyString(), eq(30L), eq(TimeUnit.MINUTES));
    }

    @Test
    @DisplayName("Redis cache hit returns cached policies without querying DB")
    void cacheHit_returnsCachedPoliciesWithoutDbQuery() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        String json = "[{\"resource\":\"berth\",\"subjectType\":\"PERMISSION\",\"subjectId\":\"berth:read\",\"targetType\":\"FIELD\",\"targetKey\":\"depth\",\"effect\":\"HIDE\",\"priority\":0,\"active\":true}]";
        when(valueOperations.get("field_policies:active")).thenReturn(json);

        List<FieldPolicy> result = service.getActivePolicies();

        assertEquals(1, result.size());
        assertEquals("berth", result.get(0).getResource());
        verifyNoInteractions(fieldPolicyRepository);
    }

    @Test
    @DisplayName("evictPolicyCache deletes key from Redis")
    void evictPolicyCache_deletesKeyFromRedis() {
        service.evictPolicyCache();

        verify(redisTemplate).delete("field_policies:active");
    }

    @Test
    @DisplayName("Redis failure gracefully degrades to database")
    void redisFailure_fallsBackToDatabase() {
        when(redisTemplate.opsForValue()).thenThrow(new RuntimeException("Redis connection refused"));

        FieldPolicy policy = new FieldPolicy();
        policy.setResource("pier");
        policy.setActive(true);

        when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(policy));

        List<FieldPolicy> result = service.getActivePolicies();

        assertEquals(1, result.size());
        assertEquals("pier", result.get(0).getResource());
    }
}
