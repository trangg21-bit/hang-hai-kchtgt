package com.hanghai.kchtg.vtssystem.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class VtsSystemEntityTest {

    @Test
    void testBuilderCreation() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("VTS ABC").build();
        assertNotNull(entity);
        assertEquals("VTS ABC", entity.getSystemName());
    }

    @Test
    void testDefaultValues() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("ABC").build();
        // Not deleted by default → deletedAt should be null
        assertNull(entity.getDeletedAt());
    }

    @Test
    void testSettersAndGetters() {
        VtsSystem entity = new VtsSystem();
        java.util.UUID uuid = java.util.UUID.randomUUID();
        entity.setId(uuid);
        entity.setSystemName("VTS ABC");
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setUpdatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        entity.setUpdatedAt(LocalDateTime.now());

        assertEquals(uuid, entity.getId());
        assertEquals("VTS ABC", entity.getSystemName());
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertNotNull(entity.getUpdatedAt());
    }

    @Test
    void testPrePersist_ApprovalStatusDefault() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("ABC").build();
        assertNull(entity.getApprovalStatus());  // null before persist
    }

    @Test
    void testFullLifecycle() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("VTS ABC").build();
        assertNull(entity.getApprovalStatus());  // null before persist

        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApproverLevel1(java.util.UUID.randomUUID());
        entity.setApproverLevel2(java.util.UUID.randomUUID());
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());

        // Soft-delete via BaseEntity
        entity.setDeletedAt(LocalDateTime.now());
        assertNotNull(entity.getDeletedAt());
    }
}
