package com.hanghai.kchtg.dikerevetment.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class DikeRevetmentEntityTest {

    private DikeRevetment entity;

    @BeforeEach
    void setUp() {
        entity = new DikeRevetment();
    }

    @Test void getters_setters_work() {
        java.util.UUID uuid = java.util.UUID.randomUUID();
        entity.setId(uuid);
        assertEquals(uuid, entity.getId());

        entity.setDikeRevetmentType(DikeRevetmentType.RIVER_DIKE);
        assertEquals(DikeRevetmentType.RIVER_DIKE, entity.getDikeRevetmentType());

        entity.setLocation("Bac Giang");
        assertEquals("Bac Giang", entity.getLocation());

        entity.setLength(150.5);
        assertEquals(150.5, entity.getLength());

        entity.setCrestElevation(10.0);
        assertEquals(10.0, entity.getCrestElevation());

        entity.setHeight(5.0);
        assertEquals(5.0, entity.getHeight());

        entity.setSurfaceMaterial("Betong");
        assertEquals("Betong", entity.getSurfaceMaterial());

        entity.setStatus("Tot");
        assertEquals("Tot", entity.getStatus());

        entity.setApprovalStatus(DikeRevetmentApprovalStatus.PROPOSED);
        assertEquals(DikeRevetmentApprovalStatus.PROPOSED, entity.getApprovalStatus());

        entity.setIsApprovedLevel1(true);
        assertTrue(entity.getIsApprovedLevel1());

        entity.setApproverLevel1("Nguyen Van A");
        assertEquals("Nguyen Van A", entity.getApproverLevel1());

        entity.setApprovedDateLevel1(LocalDate.of(2026, 1, 1));
        assertEquals(LocalDate.of(2026, 1, 1), entity.getApprovedDateLevel1());

        entity.setIsApprovedLevel2(false);
        assertFalse(entity.getIsApprovedLevel2());

        entity.setApproverLevel2("Tran Thi B");
        assertEquals("Tran Thi B", entity.getApproverLevel2());

        entity.setApprovedDateLevel2(LocalDate.of(2026, 2, 1));
        assertEquals(LocalDate.of(2026, 2, 1), entity.getApprovedDateLevel2());

        entity.setRejectionReason("Thiet ke chua dat yeu cau");
        assertEquals("Thiet ke chua dat yeu cau", entity.getRejectionReason());

        entity.setIsDeleted(false);
        assertFalse(entity.getIsDeleted());

        entity.setCreatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getCreatedBy());

        entity.setUpdatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), entity.getUpdatedBy());
    }

    @Test void builder_sets_all_fields() {
        DikeRevetment dr = DikeRevetment.builder()
                .dikeRevetmentType(DikeRevetmentType.SAND_DIKE)
                .location("Ha Noi")
                .length(200.0)
                .crestElevation(20.0)
                .height(8.0)
                .surfaceMaterial("Thep")
                .status("Tot")
                .approvalStatus(DikeRevetmentApprovalStatus.APPROVED)
                .isApprovedLevel1(true)
                .isApprovedLevel2(true)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        assertEquals(DikeRevetmentType.SAND_DIKE, dr.getDikeRevetmentType());
        assertEquals("Ha Noi", dr.getLocation());
        assertEquals(200.0, dr.getLength());
        assertEquals(DikeRevetmentApprovalStatus.APPROVED, dr.getApprovalStatus());
        assertTrue(dr.getIsApprovedLevel1());
        assertTrue(dr.getIsApprovedLevel2());
        assertEquals(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"), dr.getCreatedBy());
    }

    @Test void builder_collections_are_empty_lists_not_null() {
        DikeRevetment dr = DikeRevetment.builder()
                .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                .location("test")
                .build();

        assertNotNull(dr.getAttachments());
        assertTrue(dr.getAttachments().isEmpty());
        assertNotNull(dr.getApprovalHistory());
        assertTrue(dr.getApprovalHistory().isEmpty());
    }

    @Test void noArgsConstructor_collections_are_empty_lists() {
        DikeRevetment dr = new DikeRevetment();
        assertNotNull(dr.getAttachments());
        assertTrue(dr.getAttachments().isEmpty());
        assertNotNull(dr.getApprovalHistory());
        assertTrue(dr.getApprovalHistory().isEmpty());
    }

    @Test void builder_defaults_are_false_and_null() {
        DikeRevetment dr = DikeRevetment.builder().dikeRevetmentType(DikeRevetmentType.RIVER_DIKE).location("y").build();
        assertFalse(dr.getIsApprovedLevel1());
        assertFalse(dr.getIsApprovedLevel2());
        assertFalse(dr.getIsDeleted());
        assertNull(dr.getApprovedDateLevel1());
        assertNull(dr.getApprovedDateLevel2());
        assertNull(dr.getCreatedAt());
        assertNull(dr.getUpdatedAt());
    }

    @Test void onCreate_sets_createdAt() {
        assertNull(entity.getCreatedAt());
        entity.onCreate();
        assertNotNull(entity.getCreatedAt());
    }

    @Test void onUpdate_sets_updatedAt() {
        assertNull(entity.getUpdatedAt());
        entity.onUpdate();
        assertNotNull(entity.getUpdatedAt());
    }
}
