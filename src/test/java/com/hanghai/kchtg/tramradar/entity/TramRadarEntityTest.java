package com.hanghai.kchtg.tramradar.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class TramRadarEntityTest {

    @Test
    void testBuilderCreation() {
        TramRadar entity = TramRadar.builder()
                .tenTram("Tram ABC").viTri("Hà Nội")
                .loaiTram("Radar X").nguoiTao("test").build();
        assertNotNull(entity);
        assertEquals("Tram ABC", entity.getTenTram());
        assertEquals("Hà Nội", entity.getViTri());
    }

    @Test
    void testDefaultValues() {
        TramRadar entity = TramRadar.builder()
                .tenTram("ABC").viTri("Hà Nội").loaiTram("Radar X").nguoiTao("test").build();
        assertFalse(entity.getPheDuyetC1());
        assertFalse(entity.getPheDuyetC2());
        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testSettersAndGetters() {
        TramRadar entity = new TramRadar();
        java.util.UUID uuid = java.util.UUID.randomUUID();
        entity.setId(uuid);
        entity.setTenTram("Tram ABC");
        entity.setViTri("Hà Nội");
        entity.setLoaiTram("Radar X");
        entity.setTrangThai(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.APPROVED);
        entity.setNguoiSuaDoi("admin");
        entity.setNgaySuaDoi(LocalDateTime.now());

        assertEquals(uuid, entity.getId());
        assertEquals("Tram ABC", entity.getTenTram());
        assertEquals(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.APPROVED, entity.getTrangThai());
        assertNotNull(entity.getNgaySuaDoi());
    }

    @Test
    void testPrePersist_TrangThaiDefault() {
        // @Builder.Default doesn't set trangThai, so it's null until @PrePersist
        TramRadar entity = TramRadar.builder()
                .tenTram("ABC").viTri("Hà Nội").loaiTram("X").nguoiTao("test").build();
        assertNull(entity.getTrangThai());  // null before persist
    }

    @Test
    void testAttachmentsInit() {
        TramRadar entity = TramRadar.builder()
                .tenTram("ABC").viTri("Hà Nội").loaiTram("X").nguoiTao("test").build();
        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testFullLifecycle() {
        TramRadar entity = TramRadar.builder()
                .tenTram("Tram ABC").viTri("Hà Nội").loaiTram("X").nguoiTao("user1").build();
        assertNull(entity.getTrangThai());  // null before persist
        assertFalse(entity.getPheDuyetC1());

        entity.setTrangThai(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.APPROVED);
        entity.setPheDuyetC1(true);
        entity.setPheDuyetC2(true);
        assertEquals(com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus.APPROVED, entity.getTrangThai());

        entity.setIsDeleted(true);
        assertTrue(entity.getIsDeleted());
    }
}
