package com.hanghai.kchtg.vtssystem.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class VtsSystemEntityTest {

    @Test
    void testBuilderCreation() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("VTS ABC").location("Hà Nội").build();
        assertNotNull(entity);
        assertEquals("VTS ABC", entity.getSystemName());
    }

    @Test
    void testDefaultValues() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("ABC").location("Hà Nội").build();
        assertFalse(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        // Not deleted by default → deletedAt should be null
        assertNull(entity.getDeletedAt());
    }

    @Test
    void testSettersAndGetters() {
        VtsSystem entity = new VtsSystem();
        java.util.UUID uuid = java.util.UUID.randomUUID();
        entity.setId(uuid);
        entity.setSystemName("VTS ABC");
        entity.setLocation("Hà Nội");
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
                .systemName("ABC").location("Hà Nội").build();
        assertNull(entity.getApprovalStatus());  // null before persist
    }

    @Test
    void testFullLifecycle() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("VTS ABC").location("Hà Nội").build();
        assertNull(entity.getApprovalStatus());  // null before persist
        assertFalse(entity.getApprovedLevel1());

        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedLevel1(true);
        entity.setApprovedLevel2(true);
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());

        // Soft-delete via BaseEntity
        entity.setDeletedAt(LocalDateTime.now());
        assertNotNull(entity.getDeletedAt());
    }
}
