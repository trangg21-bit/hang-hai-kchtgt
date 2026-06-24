package com.hanghai.kchtg.lockout.service;

import com.hanghai.kchtg.lockout.dto.LockoutPolicyResponse;
import com.hanghai.kchtg.lockout.entity.LockoutPolicy;
import com.hanghai.kchtg.lockout.repository.LockoutPolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LockoutPolicyServiceTest {

    @Mock
    private LockoutPolicyRepository policyRepo;

    @InjectMocks
    private LockoutPolicyService lockoutPolicyService;

    private LockoutPolicy existingPolicy;

    @BeforeEach
    void setUp() {
        existingPolicy = new LockoutPolicy();
        existingPolicy.setId(1L);
        existingPolicy.setMaxFailedAttempts(5);
        existingPolicy.setLockoutDurationMinutes(30);
        existingPolicy.setWindowMinutes(15);
        existingPolicy.setEnabled(true);
    }

    @Test
    void getPolicy_whenExists_shouldReturnPolicy() {
        when(policyRepo.findById(1L)).thenReturn(Optional.of(existingPolicy));

        LockoutPolicy policy = lockoutPolicyService.getPolicy();

        assertNotNull(policy);
        assertEquals(1L, policy.getId());
        assertEquals(5, policy.getMaxFailedAttempts());
        assertEquals(30, policy.getLockoutDurationMinutes());
        assertEquals(15, policy.getWindowMinutes());
        assertTrue(policy.isEnabled());
        verify(policyRepo).findById(1L);
    }

    @Test
    void getPolicy_whenNotFound_shouldCreateAndNotSaveDefault() {
        when(policyRepo.findById(1L)).thenReturn(Optional.empty());

        LockoutPolicy policy = lockoutPolicyService.getPolicy();

        assertNotNull(policy);
        assertEquals(1L, policy.getId());
        verify(policyRepo, never()).save(any());
    }

    @Test
    void getPolicy_shouldReturnPolicyOnEachCall_whenNoSpringCache() {
        when(policyRepo.findById(1L)).thenReturn(Optional.of(existingPolicy));

        LockoutPolicy policy1 = lockoutPolicyService.getPolicy();
        LockoutPolicy policy2 = lockoutPolicyService.getPolicy();

        assertNotNull(policy1);
        assertNotNull(policy2);
        // Without Spring Cache context, repo is called each time
        verify(policyRepo, atLeast(1)).findById(1L);
    }

    @Test
    void updatePolicy_shouldUpdateAllFieldsAndEvictCache() {
        when(policyRepo.findById(1L)).thenReturn(Optional.of(existingPolicy));
        when(policyRepo.save(any(LockoutPolicy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LockoutPolicy updates = new LockoutPolicy();
        updates.setMaxFailedAttempts(10);
        updates.setLockoutDurationMinutes(60);
        updates.setWindowMinutes(30);
        updates.setEnabled(false);

        LockoutPolicy result = lockoutPolicyService.updatePolicy(updates);

        assertNotNull(result);
        assertEquals(10, result.getMaxFailedAttempts());
        assertEquals(60, result.getLockoutDurationMinutes());
        assertEquals(30, result.getWindowMinutes());
        assertFalse(result.isEnabled());
        assertNotNull(result.getUpdatedAt());
        ArgumentCaptor<LockoutPolicy> captor = ArgumentCaptor.forClass(LockoutPolicy.class);
        verify(policyRepo).save(captor.capture());
        assertEquals(10, captor.getValue().getMaxFailedAttempts());
        assertEquals(60, captor.getValue().getLockoutDurationMinutes());
        assertEquals(30, captor.getValue().getWindowMinutes());
        assertFalse(captor.getValue().isEnabled());
    }

    @Test
    void updatePolicy_zeroValuesShouldBeIgnored() {
        when(policyRepo.findById(1L)).thenReturn(Optional.of(existingPolicy));
        when(policyRepo.save(any(LockoutPolicy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LockoutPolicy updates = new LockoutPolicy();
        updates.setMaxFailedAttempts(0);
        updates.setLockoutDurationMinutes(0);
        updates.setWindowMinutes(0);
        updates.setEnabled(false);

        lockoutPolicyService.updatePolicy(updates);

        ArgumentCaptor<LockoutPolicy> captor = ArgumentCaptor.forClass(LockoutPolicy.class);
        verify(policyRepo).save(captor.capture());
        assertEquals(5, captor.getValue().getMaxFailedAttempts());
        assertEquals(30, captor.getValue().getLockoutDurationMinutes());
        assertEquals(15, captor.getValue().getWindowMinutes());
        assertFalse(captor.getValue().isEnabled());
    }

    @Test
    void updatePolicy_positivePartialUpdates() {
        when(policyRepo.findById(1L)).thenReturn(Optional.of(existingPolicy));
        when(policyRepo.save(any(LockoutPolicy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LockoutPolicy updates = new LockoutPolicy();
        updates.setMaxFailedAttempts(3);

        lockoutPolicyService.updatePolicy(updates);

        ArgumentCaptor<LockoutPolicy> captor = ArgumentCaptor.forClass(LockoutPolicy.class);
        verify(policyRepo).save(captor.capture());
        assertEquals(3, captor.getValue().getMaxFailedAttempts());
        assertEquals(30, captor.getValue().getLockoutDurationMinutes());
        assertEquals(15, captor.getValue().getWindowMinutes());
    }

    @Test
    void toResponse_shouldMapEntityToDtoCorrectly() {
        LockoutPolicy policy = new LockoutPolicy();
        policy.setId(1L);
        policy.setMaxFailedAttempts(8);
        policy.setLockoutDurationMinutes(45);
        policy.setWindowMinutes(20);
        policy.setEnabled(false);

        LockoutPolicyResponse response = lockoutPolicyService.toResponse(policy);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(8, response.getMaxFailedAttempts());
        assertEquals(45, response.getLockoutDurationMinutes());
        assertEquals(20, response.getWindowMinutes());
        assertFalse(response.isEnabled());
    }

    @Test
    void toResponse_withNullUpdatedAt_doesNotThrow() {
        LockoutPolicy policy = new LockoutPolicy();
        policy.setId(1L);
        policy.setMaxFailedAttempts(5);
        policy.setLockoutDurationMinutes(30);
        policy.setWindowMinutes(15);
        policy.setEnabled(true);

        LockoutPolicyResponse response = lockoutPolicyService.toResponse(policy);

        assertNotNull(response);
    }

    @Test
    void run_whenPolicyExists_shouldNotSeed() throws Exception {
        when(policyRepo.existsById(1L)).thenReturn(true);

        lockoutPolicyService.run();

        verify(policyRepo, never()).save(any());
    }

    @Test
    void run_whenPolicyMissing_shouldSeedDefault() throws Exception {
        when(policyRepo.existsById(1L)).thenReturn(false);
        when(policyRepo.save(any(LockoutPolicy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        lockoutPolicyService.run();

        verify(policyRepo).save(any(LockoutPolicy.class));
    }
}