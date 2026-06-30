package com.hanghai.kchtg.vts.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class HeThongVTSEntityTest {

    @Test
    void testBuilderCreation() {
        HeThongVTS entity = HeThongVTS.builder()
                .tenHeThong("VTS ABC").viTri("Hà Nội")
                .nguoiTao("test").build();
        assertNotNull(entity);
        assertEquals("VTS ABC", entity.getTenHeThong());
    }

    @Test
    void testDefaultValues() {
        HeThongVTS entity = HeThongVTS.builder()
                .tenHeThong("ABC").viTri("Hà Nội").nguoiTao("test").build();
        assertFalse(entity.getPheDuyetC1());
        assertFalse(entity.getPheDuyetC2());
        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testSettersAndGetters() {
        HeThongVTS entity = new HeThongVTS();
        entity.setId(1L);
        entity.setTenHeThong("VTS ABC");
        entity.setViTri("Hà Nội");
        entity.setTrangThai("APPROVED");
        entity.setNguoiSuaDoi("admin");
        entity.setNgaySuaDoi(LocalDateTime.now());

        assertEquals(1L, entity.getId());
        assertEquals("VTS ABC", entity.getTenHeThong());
        assertEquals("APPROVED", entity.getTrangThai());
        assertNotNull(entity.getNgaySuaDoi());
    }

    @Test
    void testPrePersist_TrangThaiDefault() {
        // @Builder.Default doesn't set trangThai, so it's null until @PrePersist
        HeThongVTS entity = HeThongVTS.builder()
                .tenHeThong("ABC").viTri("Hà Nội").nguoiTao("test").build();
        assertNull(entity.getTrangThai());  // null before persist
    }

    @Test
    void testAttachmentsInit() {
        HeThongVTS entity = HeThongVTS.builder()
                .tenHeThong("ABC").viTri("Hà Nội").nguoiTao("test").build();
        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testFullLifecycle() {
        HeThongVTS entity = HeThongVTS.builder()
                .tenHeThong("VTS ABC").viTri("Hà Nội").nguoiTao("user1").build();
        assertNull(entity.getTrangThai());  // null before persist
        assertFalse(entity.getPheDuyetC1());

        entity.setTrangThai("APPROVED");
        entity.setPheDuyetC1(true);
        entity.setPheDuyetC2(true);
        assertEquals("APPROVED", entity.getTrangThai());

        entity.setIsDeleted(true);
        assertTrue(entity.getIsDeleted());
    }
}
