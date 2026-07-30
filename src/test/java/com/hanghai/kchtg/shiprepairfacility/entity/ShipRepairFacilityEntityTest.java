package com.hanghai.kchtg.shiprepairfacility.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ShipRepairFacilityEntityTest {

    @Test
    void testBuilderCreation() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        assertNotNull(entity);
        assertEquals("Cơ sở ABC", entity.getFacilityName());
        assertEquals("Hà Nội", entity.getAddress());
        assertEquals(1, entity.getProvinceId());
        assertEquals(FacilityType.REPAIR, entity.getFacilityType());
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getCreatedBy());
    }

    @Test
    void testDefaultValues() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        // @Builder.Default values should be applied
        assertFalse(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertFalse(entity.getIsDeleted());
        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testSettersAndGetters() {
        ShipRepairFacility entity = new ShipRepairFacility();
        UUID uuid = UUID.randomUUID();
        entity.setId(uuid);
        entity.setFacilityName("Cơ sở ABC");
        entity.setAddress("Hà Nội");
        entity.setProvinceId(1);
        entity.setPhone("0123456789");
        entity.setEmail("test@example.com");
        entity.setFacilityType(FacilityType.REPAIR);
        entity.setCapacity("Khả năng 100");
        entity.setAuthority("Bộ Quốc phòng");
        entity.setApprovalStatus(ShipRepairApprovalStatus.APPROVED);
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1("admin1");
        entity.setApprovedDateLevel1(LocalDateTime.now());
        entity.setApprovedLevel2(true);
        entity.setApproverLevel2("director");
        entity.setApprovedDateLevel2(LocalDateTime.now());
        entity.setRejectionReason("Không đủ điều kiện");
        entity.setUpdatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        entity.setUpdatedDate(LocalDateTime.now());

        assertEquals(uuid, entity.getId());
        assertEquals("Cơ sở ABC", entity.getFacilityName());
        assertEquals("Hà Nội", entity.getAddress());
        assertEquals("0123456789", entity.getPhone());
        assertEquals("test@example.com", entity.getEmail());
        assertEquals(FacilityType.REPAIR, entity.getFacilityType());
        assertEquals("Khả năng 100", entity.getCapacity());
        assertEquals("Bộ Quốc phòng", entity.getAuthority());
        assertEquals(ShipRepairApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        assertEquals("admin1", entity.getApproverLevel1());
        assertNotNull(entity.getApprovedDateLevel1());
        assertTrue(entity.getApprovedLevel2());
        assertEquals("director", entity.getApproverLevel2());
        assertNotNull(entity.getApprovedDateLevel2());
        assertEquals("Không đủ điều kiện", entity.getRejectionReason());
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getUpdatedBy());
        assertNotNull(entity.getUpdatedDate());
    }

    @Test
    void testPrePersist_TrangThaiDefault() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        entity.setApprovalStatus(null);
        entity.prePersist();

        assertEquals(ShipRepairApprovalStatus.PROPOSED, entity.getApprovalStatus());
    }

    @Test
    void testPrePersist_ApprovedLevel1Default() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        entity.setApprovedLevel1(null);
        entity.prePersist();

        assertFalse(entity.getApprovedLevel1());
    }

    @Test
    void testPrePersist_ApprovedLevel2Default() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        entity.setApprovedLevel2(null);
        entity.prePersist();

        assertFalse(entity.getApprovedLevel2());
    }

    @Test
    void testPrePersist_IsDeletedDefault() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        entity.setIsDeleted(null);
        entity.prePersist();

        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testAttachmentsInit() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testPrePersist_PreservesProvidedValues() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .approvalStatus(ShipRepairApprovalStatus.UNDER_REVIEW)
                .approvedLevel1(true)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        entity.prePersist();

        assertEquals(ShipRepairApprovalStatus.UNDER_REVIEW, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testFullLifecycle() {
        // Create
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        entity.prePersist();

        assertEquals(ShipRepairApprovalStatus.PROPOSED, entity.getApprovalStatus());
        assertFalse(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertFalse(entity.getIsDeleted());

        // Update
        entity.setApprovalStatus(ShipRepairApprovalStatus.APPROVED);
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1("admin1");
        entity.setApprovedLevel2(true);
        entity.setApproverLevel2("director");
        entity.setUpdatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        entity.setUpdatedDate(LocalDateTime.now());

        assertEquals(ShipRepairApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        assertEquals("admin1", entity.getApproverLevel1());
        assertTrue(entity.getApprovedLevel2());
        assertEquals("director", entity.getApproverLevel2());
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getUpdatedBy());

        // Revert to under review
        entity.setApprovalStatus(ShipRepairApprovalStatus.UNDER_REVIEW);
        assertEquals(ShipRepairApprovalStatus.UNDER_REVIEW, entity.getApprovalStatus());

        // Soft delete
        entity.setIsDeleted(true);
        assertTrue(entity.getIsDeleted());
    }

    @Test
    void testNoArgsConstructor() {
        ShipRepairFacility entity = new ShipRepairFacility();
        entity.setFacilityName("ABC");
        entity.setAddress("Hà Nội");
        entity.setProvinceId(1);
        entity.setFacilityType(FacilityType.REPAIR);
        entity.setCreatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertEquals("ABC", entity.getFacilityName());
        assertEquals("Hà Nội", entity.getAddress());
        assertEquals(1, entity.getProvinceId());
        assertEquals(FacilityType.REPAIR, entity.getFacilityType());
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getCreatedBy());
    }

    @Test
    void testAllArgsConstructor() {
        UUID uuid = UUID.randomUUID();
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .id(uuid)
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .phone("0123456789")
                .email("test@test.com")
                .facilityType(FacilityType.REPAIR)
                .capacity("Khả năng 100")
                .authority("Bộ Quốc phòng")
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(true)
                .approverLevel1("admin1")
                .approvedDateLevel1(LocalDateTime.now())
                .approvedLevel2(true)
                .approverLevel2("director")
                .approvedDateLevel2(LocalDateTime.now())
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .createdDate(LocalDateTime.now())
                .updatedDate(LocalDateTime.now())
                .updatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .isDeleted(false)
                .build();

        assertEquals(uuid, entity.getId());
        assertEquals("ABC", entity.getFacilityName());
        assertTrue(entity.getApprovedLevel1());
        assertTrue(entity.getApprovedLevel2());
        assertFalse(entity.getIsDeleted());
    }

@Test
    void testAllArgsConstructor_ListType() {
        UUID uuid = UUID.randomUUID();
        java.util.List<ShipRepairFacilityAttachment> emptyList = new java.util.ArrayList<>();
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .id(uuid)
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .phone("0123456789")
                .email("test@test.com")
                .facilityType(FacilityType.REPAIR)
                .capacity("Khả năng 100")
                .authority("Bộ Quốc phòng")
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(true)
                .approverLevel1("admin1")
                .approvedDateLevel1(LocalDateTime.now())
                .approvedLevel2(true)
                .approverLevel2("director")
                .approvedDateLevel2(LocalDateTime.now())
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .createdDate(LocalDateTime.now())
                .updatedDate(LocalDateTime.now())
                .updatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .isDeleted(false)
                .attachments(emptyList)
                .build();
        assertEquals(emptyList, entity.getAttachments());
    }

    @Test
    void testEqualsAndHashCode_via_Lombok_Data() {
        ShipRepairFacility a = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        ShipRepairFacility b = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void testToString() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        String str = entity.toString();
        assertNotNull(str);
        assertTrue(str.contains("ABC"));
        assertTrue(str.contains("Hà Nội"));
    }
}
