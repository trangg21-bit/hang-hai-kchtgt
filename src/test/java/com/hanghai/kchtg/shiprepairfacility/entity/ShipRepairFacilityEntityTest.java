package com.hanghai.kchtg.shiprepairfacility.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
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
        assertNull(entity.getDeletedAt());
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
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1(UUID.randomUUID());
        entity.setApprovedDateLevel1(LocalDateTime.now());
        entity.setApprovedLevel2(true);
        entity.setApproverLevel2(UUID.randomUUID());
        entity.setApprovedDateLevel2(LocalDateTime.now());
        entity.setRejectionReason("Không đủ điều kiện");
        entity.setUpdatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertEquals(uuid, entity.getId());
        assertEquals("Cơ sở ABC", entity.getFacilityName());
        assertEquals("Hà Nội", entity.getAddress());
        assertEquals("0123456789", entity.getPhone());
        assertEquals("test@example.com", entity.getEmail());
        assertEquals(FacilityType.REPAIR, entity.getFacilityType());
        assertEquals("Khả năng 100", entity.getCapacity());
        assertEquals("Bộ Quốc phòng", entity.getAuthority());
        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        
        assertNotNull(entity.getApprovedDateLevel1());
        assertTrue(entity.getApprovedLevel2());
        
        assertNotNull(entity.getApprovedDateLevel2());
        assertEquals("Không đủ điều kiện", entity.getRejectionReason());
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getUpdatedBy());
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

        assertEquals(ApprovalStatus.PROPOSED, entity.getApprovalStatus());
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

        entity.prePersist();

        assertNull(entity.getDeletedAt());
    }

    @Test
    void testPrePersist_PreservesProvidedValues() {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName("ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .approvedLevel1(true)
                .approvedLevel2(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        entity.prePersist();

        assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertNull(entity.getDeletedAt());
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

        assertEquals(ApprovalStatus.PROPOSED, entity.getApprovalStatus());
        assertFalse(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertNull(entity.getDeletedAt());

        // Update
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedLevel1(true);
        entity.setApproverLevel1(UUID.randomUUID());
        entity.setApprovedLevel2(true);
        entity.setApproverLevel2(UUID.randomUUID());
        entity.setUpdatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));

        assertEquals(ApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertTrue(entity.getApprovedLevel1());
        
        assertTrue(entity.getApprovedLevel2());
        
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getUpdatedBy());

        // Revert to under review
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        assertEquals(ApprovalStatus.PENDING_APPROVAL, entity.getApprovalStatus());

        // Soft delete
        entity.setDeletedAt(LocalDateTime.now());
        assertNotNull(entity.getDeletedAt());
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
                .approvalStatus(ApprovalStatus.APPROVED)
                .approvedLevel1(true)
                .approverLevel1(UUID.randomUUID())
                .approvedDateLevel1(LocalDateTime.now())
                .approvedLevel2(true)
                .approverLevel2(UUID.randomUUID())
                .approvedDateLevel2(LocalDateTime.now())
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        assertEquals(uuid, entity.getId());
        assertEquals("ABC", entity.getFacilityName());
        assertTrue(entity.getApprovedLevel1());
        assertTrue(entity.getApprovedLevel2());
        assertNull(entity.getDeletedAt());
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
