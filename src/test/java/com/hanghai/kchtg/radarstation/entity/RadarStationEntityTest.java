package com.hanghai.kchtg.radarstation.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class RadarStationEntityTest {

    @Test
    void testBuilderCreation() {
        RadarStation entity = RadarStation.builder()
                .stationName("Tram ABC").location("Hà Nội")
                .stationType("Radar X").createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        assertNotNull(entity);
        assertEquals("Tram ABC", entity.getStationName());
        assertEquals("Hà Nội", entity.getLocation());
    }

    @Test
    void testDefaultValues() {
        RadarStation entity = RadarStation.builder()
                .stationName("ABC").location("Hà Nội").stationType("Radar X").createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        assertFalse(entity.getApprovedLevel1());
        assertFalse(entity.getApprovedLevel2());
        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testSettersAndGetters() {
        RadarStation entity = new RadarStation();
        java.util.UUID uuid = java.util.UUID.randomUUID();
        entity.setId(uuid);
        entity.setStationName("Tram ABC");
        entity.setLocation("Hà Nội");
        entity.setStationType("Radar X");
        entity.setApprovalStatus(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.APPROVED);
        entity.setUpdatedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
        entity.setUpdatedDate(LocalDateTime.now());

        assertEquals(uuid, entity.getId());
        assertEquals("Tram ABC", entity.getStationName());
        assertEquals(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.APPROVED, entity.getApprovalStatus());
        assertNotNull(entity.getUpdatedDate());
    }

    @Test
    void testPrePersist_TrangThaiDefault() {
        // @Builder.Default doesn't set approvalStatus, so it's null until @PrePersist
        RadarStation entity = RadarStation.builder()
                .stationName("ABC").location("Hà Nội").stationType("X").createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        assertNull(entity.getApprovalStatus());  // null before persist
    }

    @Test
    void testAttachmentsInit() {
        RadarStation entity = RadarStation.builder()
                .stationName("ABC").location("Hà Nội").stationType("X").createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testFullLifecycle() {
        RadarStation entity = RadarStation.builder()
                .stationName("Tram ABC").location("Hà Nội").stationType("X").createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        assertNull(entity.getApprovalStatus());  // null before persist
        assertFalse(entity.getApprovedLevel1());

        entity.setApprovalStatus(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.APPROVED);
        entity.setApprovedLevel1(true);
        entity.setApprovedLevel2(true);
        assertEquals(com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus.APPROVED, entity.getApprovalStatus());

        entity.setIsDeleted(true);
        assertTrue(entity.getIsDeleted());
    }
}
