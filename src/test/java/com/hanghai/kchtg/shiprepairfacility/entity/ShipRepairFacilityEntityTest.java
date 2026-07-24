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
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
                .build();

        assertNotNull(entity);
        assertEquals("Cơ sở ABC", entity.getFacilityName());
        assertEquals("Hà Nội", entity.getAddress());
        assertEquals("Hà Nội", entity.getProvince());
        assertEquals(LoaiCoSo.CS_SUA_CHUA, entity.getFacilityType());
        assertEquals("test", entity.getCreatedBy());
    }

    @Test
    void testDefaultValues() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
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
        entity.setProvince("Hà Nội");
        entity.setPhone("0123456789");
        entity.setEmail("test@example.com");
        entity.setFacilityType(LoaiCoSo.CS_SUA_CHUA);
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
        entity.setUpdatedBy("admin");
        entity.setUpdatedDate(LocalDateTime.now());

        assertEquals(uuid, entity.getId());
        assertEquals("Cơ sở ABC", entity.getFacilityName());
        assertEquals("Hà Nội", entity.getAddress());
        assertEquals("0123456789", entity.getPhone());
        assertEquals("test@example.com", entity.getEmail());
        assertEquals(LoaiCoSo.CS_SUA_CHUA, entity.getFacilityType());
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
        assertEquals("admin", entity.getUpdatedBy());
        assertNotNull(entity.getUpdatedDate());
    }

    @Test
    void testPrePersist_TrangThaiDefault() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
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
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
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
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
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
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
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
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
                .build();

        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testPrePersist_PreservesProvidedValues() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .approvalStatus(ShipRepairApprovalStatus.UNDER_REVIEW)
                .approvedLevel1(true)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy("test")
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
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("user1")
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
        entity.setUpdatedBy("admin");
        entity.setUpdatedDate(LocalDateTime.now());

        assertEquals(ShipRepairApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        assertEquals("admin1", entity.getApproverLevel1());
        assertTrue(entity.getApprovedLevel2());
        assertEquals("director", entity.getApproverLevel2());
        assertEquals("admin", entity.getUpdatedBy());

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
        entity.setProvince("Hà Nội");
        entity.setFacilityType(LoaiCoSo.CS_SUA_CHUA);
        entity.setCreatedBy("test");

        assertEquals("ABC", entity.getFacilityName());
        assertEquals("Hà Nội", entity.getAddress());
        assertEquals("Hà Nội", entity.getProvince());
        assertEquals(LoaiCoSo.CS_SUA_CHUA, entity.getFacilityType());
        assertEquals("test", entity.getCreatedBy());
    }

    @Test
    void testAllArgsConstructor() {
        UUID uuid = UUID.randomUUID();
        ShipRepairFacility entity = new ShipRepairFacility(
                uuid, "ABC", "Hà Nội", "Hà Nội", "0123456789", "test@test.com",
                LoaiCoSo.CS_SUA_CHUA, "Khả năng 100", "Bộ Quốc phòng", null, null, ShipRepairApprovalStatus.APPROVED,
                true, "admin1", LocalDateTime.now(),
                true, "director", LocalDateTime.now(),
                null, "user1", LocalDateTime.now(),
                LocalDateTime.now(), "admin", false,
                new java.util.ArrayList<>()
        );

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
        ShipRepairFacility entity = new ShipRepairFacility(
                uuid, "ABC", "Hà Nội", "Hà Nội", "0123456789", "test@test.com",
                LoaiCoSo.CS_SUA_CHUA, "Khả năng 100", "Bộ Quốc phòng", null, null, ShipRepairApprovalStatus.APPROVED,
                true, "admin1", LocalDateTime.now(),
                true, "director", LocalDateTime.now(),
                null, "user1", LocalDateTime.now(),
                LocalDateTime.now(), "admin", false,
                emptyList
        );
        assertEquals(emptyList, entity.getAttachments());
    }

    @Test
    void testEqualsAndHashCode_via_Lombok_Data() {
        ShipRepairFacility a = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
                .build();

        ShipRepairFacility b = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
                .build();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void testToString() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .province("Hà Nội")
                .facilityType(LoaiCoSo.CS_SUA_CHUA)
                .createdBy("test")
                .build();

        String str = entity.toString();
        assertNotNull(str);
        assertTrue(str.contains("ABC"));
        assertTrue(str.contains("Hà Nội"));
    }
}
