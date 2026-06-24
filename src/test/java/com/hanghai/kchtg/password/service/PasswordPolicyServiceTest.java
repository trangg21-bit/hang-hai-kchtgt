package com.hanghai.kchtg.password.service;

import com.hanghai.kchtg.password.dto.PasswordPolicyResponse;
import com.hanghai.kchtg.password.entity.PasswordPolicy;
import com.hanghai.kchtg.password.repository.PasswordPolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PasswordPolicyService - singleton CRUD, caching, seeding.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PasswordPolicyServiceTest {

    @Mock
    private PasswordPolicyRepository policyRepository;

    @InjectMocks
    private PasswordPolicyService service;

    private static final UUID DEFAULT_UUID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Test
    void getPolicy_existingPolicy_returnsIt() {
        PasswordPolicy existing = buildPolicy(12, true, true, true, true);
        when(policyRepository.findById(DEFAULT_UUID)).thenReturn(Optional.of(existing));

        PasswordPolicy result = service.getPolicy();

        assertNotNull(result);
        assertEquals(12, result.getMinLength());
        verify(policyRepository).findById(DEFAULT_UUID);
    }

    @Test
    void getPolicy_missingPolicy_createsDefault() {
        when(policyRepository.findById(DEFAULT_UUID)).thenReturn(Optional.empty());
        when(policyRepository.save(any(PasswordPolicy.class))).thenAnswer(inv -> {
            PasswordPolicy p = inv.getArgument(0);
            p.setId(DEFAULT_UUID);
            return p;
        });

        PasswordPolicy result = service.getPolicy();

        assertNotNull(result);
        assertEquals(DEFAULT_UUID, result.getId());
        // findById called once (cache miss triggers createDefault which returns new entity)
        verify(policyRepository).findById(DEFAULT_UUID);
    }

    @Test
    void updatePolicy_updatesFields() {
        PasswordPolicy existing = buildPolicy(12, true, true, true, true);
        existing.setCreatedAt(LocalDateTime.now().minusDays(30));
        existing.setUpdatedAt(LocalDateTime.now().minusDays(30));

        when(policyRepository.findById(DEFAULT_UUID)).thenReturn(Optional.of(existing));
        when(policyRepository.save(any(PasswordPolicy.class))).thenAnswer(inv -> inv.getArgument(0));

        PasswordPolicy updates = new PasswordPolicy();
        updates.setMinLength(16);
        updates.setRequireUppercase(true);
        updates.setRequireLowercase(true);
        updates.setRequireDigit(true);
        updates.setRequireSpecialChar(true);
        updates.setMaxAgeDays(60);
        updates.setHistoryDepth(3);
        updates.setSpecialCharSet("!@#");
        updates.setBlockUsernameInPassword(true);

        PasswordPolicy result = service.updatePolicy(updates);

        assertEquals(16, result.getMinLength());
        assertTrue(result.isRequireUppercase());
        assertTrue(result.isRequireLowercase());
        assertTrue(result.isRequireDigit());
        assertTrue(result.isRequireSpecialChar());
        assertEquals(60, result.getMaxAgeDays());
        assertEquals(3, result.getHistoryDepth());
        assertEquals("!@#", result.getSpecialCharSet());
        assertTrue(result.isBlockUsernameInPassword());
        // updatedAt should have been updated
        assertNotNull(result.getUpdatedAt());
        verify(policyRepository).save(existing);
    }

    @Test
    void updatePolicy_zeroMinLength_keepsExisting() {
        PasswordPolicy existing = buildPolicy(12, true, true, true, true);
        existing.setCreatedAt(LocalDateTime.now().minusDays(30));
        existing.setUpdatedAt(LocalDateTime.now().minusDays(30));

        when(policyRepository.findById(DEFAULT_UUID)).thenReturn(Optional.of(existing));
        when(policyRepository.save(any(PasswordPolicy.class))).thenAnswer(inv -> inv.getArgument(0));

        PasswordPolicy updates = new PasswordPolicy();
        updates.setMinLength(0); // should NOT override since 0 is not > 0

        PasswordPolicy result = service.updatePolicy(updates);

        assertEquals(12, result.getMinLength()); // unchanged
    }

    @Test
    void updatePolicy_negativeHistoryDepth_keepsExisting() {
        PasswordPolicy existing = buildPolicy(12, true, true, true, true);
        existing.setCreatedAt(LocalDateTime.now().minusDays(30));
        existing.setUpdatedAt(LocalDateTime.now().minusDays(30));

        when(policyRepository.findById(DEFAULT_UUID)).thenReturn(Optional.of(existing));
        when(policyRepository.save(any(PasswordPolicy.class))).thenAnswer(inv -> inv.getArgument(0));

        PasswordPolicy updates = new PasswordPolicy();
        updates.setHistoryDepth(-1); // should NOT override since -1 < 0

        PasswordPolicy result = service.updatePolicy(updates);

        assertEquals(5, result.getHistoryDepth()); // unchanged
    }

    @Test
    void updatePolicy_blankSpecialCharSet_keepsExisting() {
        PasswordPolicy existing = buildPolicy(12, true, true, true, true);
        existing.setSpecialCharSet("!@#$%^");
        existing.setCreatedAt(LocalDateTime.now().minusDays(30));
        existing.setUpdatedAt(LocalDateTime.now().minusDays(30));

        when(policyRepository.findById(DEFAULT_UUID)).thenReturn(Optional.of(existing));
        when(policyRepository.save(any(PasswordPolicy.class))).thenAnswer(inv -> inv.getArgument(0));

        PasswordPolicy updates = new PasswordPolicy();
        updates.setSpecialCharSet("  "); // blank

        PasswordPolicy result = service.updatePolicy(updates);

        assertEquals("!@#$%^", result.getSpecialCharSet()); // unchanged
    }

    @Test
    void toResponse_mapsFieldsCorrectly() {
        PasswordPolicy policy = buildPolicy(14, true, false, true, true);
        policy.setId(DEFAULT_UUID);
        LocalDateTime now = LocalDateTime.now();
        policy.setCreatedAt(now);
        policy.setUpdatedAt(now);

        PasswordPolicyResponse response = service.toResponse(policy);

        assertEquals(DEFAULT_UUID, response.getId());
        assertEquals(14, response.getMinLength());
        assertTrue(response.isRequireUppercase());
        assertFalse(response.isRequireLowercase());
        assertTrue(response.isRequireDigit());
        assertTrue(response.isRequireSpecialChar());
        assertEquals("2026-06-24T", response.getCreatedAt().substring(0, 11));
        assertEquals("2026-06-24T", response.getUpdatedAt().substring(0, 11));
    }

    @Test
    void toResponse_nullTimestamps_returnsNull() {
        PasswordPolicy policy = buildPolicy(10, true, true, true, true);
        policy.setCreatedAt(null);
        policy.setUpdatedAt(null);

        PasswordPolicyResponse response = service.toResponse(policy);

        assertNull(response.getCreatedAt());
        assertNull(response.getUpdatedAt());
    }

    @Test
    void run_seedsPolicy_ifNotExists() throws Exception {
        when(policyRepository.existsById(DEFAULT_UUID)).thenReturn(false);
        when(policyRepository.save(any(PasswordPolicy.class))).thenAnswer(inv -> {
            PasswordPolicy p = inv.getArgument(0);
            p.setId(DEFAULT_UUID);
            return p;
        });

        assertDoesNotThrow(() -> service.run());

        verify(policyRepository).existsById(DEFAULT_UUID);
        verify(policyRepository).save(any(PasswordPolicy.class));
    }

    @Test
    void run_doesNotSeed_ifAlreadyExists() throws Exception {
        when(policyRepository.existsById(DEFAULT_UUID)).thenReturn(true);

        assertDoesNotThrow(() -> service.run());

        verify(policyRepository, never()).save(any());
    }

    // =========================================================================
    // helpers
    // =========================================================================

    private PasswordPolicy buildPolicy(int minLen, boolean up, boolean low, boolean dig, boolean sp) {
        PasswordPolicy p = new PasswordPolicy();
        p.setId(DEFAULT_UUID);
        p.setMinLength(minLen);
        p.setRequireUppercase(up);
        p.setRequireLowercase(low);
        p.setRequireDigit(dig);
        p.setRequireSpecialChar(sp);
        p.setMaxAgeDays(90);
        p.setHistoryDepth(5);
        p.setBlockUsernameInPassword(true);
        p.setCreatedAt(LocalDateTime.now().minusDays(30));
        p.setUpdatedAt(LocalDateTime.now().minusDays(30));
        return p;
    }
}