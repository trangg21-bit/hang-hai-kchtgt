package com.hanghai.kchtg.vtssystem.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class VtsSystemEntityTest {

    @Test
    void testBuilderCreation() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("VTS ABC").location("Hà Nội")
                .createdBy("test").build();
        assertNotNull(entity);
        assertEquals("VTS ABC", entity.getSystemName());
    }

    @Test
    void testDefaultValues() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("ABC").location("Hà Nội").createdBy("test").build();
        assertFalse(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testSettersAndGetters() {
        VtsSystem entity = new VtsSystem();
        java.util.UUID uuid = java.util.UUID.randomUUID();
        entity.setId(uuid);
        entity.setSystemName("VTS ABC");
        entity.setLocation("Hà Nội");
        entity.setApprovalStatus("APPROVED");
        entity.setUpdatedBy("admin");
        entity.setUpdatedDate(LocalDateTime.now());

        assertEquals(uuid, entity.getId());
        assertEquals("VTS ABC", entity.getSystemName());
        assertEquals("APPROVED", entity.getApprovalStatus());
        assertNotNull(entity.getUpdatedDate());
    }

    @Test
    void testPrePersist_ApprovalStatusDefault() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("ABC").location("Hà Nội").createdBy("test").build();
        assertNull(entity.getApprovalStatus());  // null before persist
    }

    @Test
    void testAttachmentsInit() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("ABC").location("Hà Nội").createdBy("test").build();
        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testFullLifecycle() {
        VtsSystem entity = VtsSystem.builder()
                .systemName("VTS ABC").location("Hà Nội").createdBy("user1").build();
        assertNull(entity.getApprovalStatus());  // null before persist
        assertFalse(entity.getApprovedLevel1());

        entity.setApprovalStatus("APPROVED");
        entity.setApprovedLevel1(true);
        entity.setApprovedLevel2(true);
        assertEquals("APPROVED", entity.getApprovalStatus());

        entity.setIsDeleted(true);
        assertTrue(entity.getIsDeleted());
    }
}
