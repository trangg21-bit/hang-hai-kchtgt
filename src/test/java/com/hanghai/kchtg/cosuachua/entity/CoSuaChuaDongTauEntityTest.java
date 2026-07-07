package com.hanghai.kchtg.cosuachua.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class CoSuaChuaDongTauEntityTest {

    @Test
    void testBuilderCreation() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        assertNotNull(entity);
        assertEquals("Cơ sở ABC", entity.getTenCoSo());
        assertEquals("Hà Nội", entity.getDiaChi());
        assertEquals("Hà Nội", entity.getTinhThanh());
        assertEquals("Sửa chữa", entity.getLoaiCoSo());
        assertEquals("test", entity.getNguoiTao());
    }

    @Test
    void testDefaultValues() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        // @Builder.Default values should be applied
        assertFalse(entity.getPheDuyetC1());
        assertFalse(entity.getPheDuyetC2());
        assertFalse(entity.getIsDeleted());
        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testSettersAndGetters() {
        CoSuaChuaDongTau entity = new CoSuaChuaDongTau();
        entity.setId(1L);
        entity.setTenCoSo("Cơ sở ABC");
        entity.setDiaChi("Hà Nội");
        entity.setTinhThanh("Hà Nội");
        entity.setSoDienThoai("0123456789");
        entity.setEmail("test@example.com");
        entity.setLoaiCoSo("Sửa chữa");
        entity.setKhaNang("Khả năng 100");
        entity.setChuQuan("Bộ Quốc phòng");
        entity.setTrangThai("APPROVED");
        entity.setPheDuyetC1(true);
        entity.setNguoiPheDuyetC1("admin1");
        entity.setNgayPheDuyetC1(LocalDateTime.now());
        entity.setPheDuyetC2(true);
        entity.setNguoiPheDuyetC2("director");
        entity.setNgayPheDuyetC2(LocalDateTime.now());
        entity.setLyDoTuChoi("Không đủ điều kiện");
        entity.setNguoiSuaDoi("admin");
        entity.setNgaySuaDoi(LocalDateTime.now());

        assertEquals(1L, entity.getId());
        assertEquals("Cơ sở ABC", entity.getTenCoSo());
        assertEquals("Hà Nội", entity.getDiaChi());
        assertEquals("0123456789", entity.getSoDienThoai());
        assertEquals("test@example.com", entity.getEmail());
        assertEquals("Sửa chữa", entity.getLoaiCoSo());
        assertEquals("Khả năng 100", entity.getKhaNang());
        assertEquals("Bộ Quốc phòng", entity.getChuQuan());
        assertEquals("APPROVED", entity.getTrangThai());
        assertTrue(entity.getPheDuyetC1());
        assertEquals("admin1", entity.getNguoiPheDuyetC1());
        assertNotNull(entity.getNgayPheDuyetC1());
        assertTrue(entity.getPheDuyetC2());
        assertEquals("director", entity.getNguoiPheDuyetC2());
        assertNotNull(entity.getNgayPheDuyetC2());
        assertEquals("Không đủ điều kiện", entity.getLyDoTuChoi());
        assertEquals("admin", entity.getNguoiSuaDoi());
        assertNotNull(entity.getNgaySuaDoi());
    }

    @Test
    void testPrePersist_TrangThaiDefault() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        entity.setTrangThai(null);
        entity.prePersist();

        assertEquals("PROPOSED", entity.getTrangThai());
    }

    @Test
    void testPrePersist_PheDuyetC1Default() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        entity.setPheDuyetC1(null);
        entity.prePersist();

        assertFalse(entity.getPheDuyetC1());
    }

    @Test
    void testPrePersist_PheDuyetC2Default() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        entity.setPheDuyetC2(null);
        entity.prePersist();

        assertFalse(entity.getPheDuyetC2());
    }

    @Test
    void testPrePersist_IsDeletedDefault() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        entity.setIsDeleted(null);
        entity.prePersist();

        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testAttachmentsInit() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        assertNotNull(entity.getAttachments());
        assertTrue(entity.getAttachments().isEmpty());
    }

    @Test
    void testPrePersist_PreservesProvidedValues() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("UNDER_REVIEW")
                .pheDuyetC1(true)
                .pheDuyetC2(false)
                .isDeleted(false)
                .nguoiTao("test")
                .build();

        entity.prePersist();

        assertEquals("UNDER_REVIEW", entity.getTrangThai());
        assertTrue(entity.getPheDuyetC1());
        assertFalse(entity.getPheDuyetC2());
        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testFullLifecycle() {
        // Create
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("user1")
                .build();

        entity.prePersist();

        assertEquals("PROPOSED", entity.getTrangThai());
        assertFalse(entity.getPheDuyetC1());
        assertFalse(entity.getPheDuyetC2());
        assertFalse(entity.getIsDeleted());

        // Update
        entity.setTrangThai("APPROVED");
        entity.setPheDuyetC1(true);
        entity.setNguoiPheDuyetC1("admin1");
        entity.setPheDuyetC2(true);
        entity.setNguoiPheDuyetC2("director");
        entity.setNguoiSuaDoi("admin");
        entity.setNgaySuaDoi(LocalDateTime.now());

        assertEquals("APPROVED", entity.getTrangThai());
        assertTrue(entity.getPheDuyetC1());
        assertEquals("admin1", entity.getNguoiPheDuyetC1());
        assertTrue(entity.getPheDuyetC2());
        assertEquals("director", entity.getNguoiPheDuyetC2());
        assertEquals("admin", entity.getNguoiSuaDoi());

        // Revert to under review
        entity.setTrangThai("UNDER_REVIEW");
        assertEquals("UNDER_REVIEW", entity.getTrangThai());

        // Soft delete
        entity.setIsDeleted(true);
        assertTrue(entity.getIsDeleted());
    }

    @Test
    void testNoArgsConstructor() {
        CoSuaChuaDongTau entity = new CoSuaChuaDongTau();
        entity.setTenCoSo("ABC");
        entity.setDiaChi("Hà Nội");
        entity.setTinhThanh("Hà Nội");
        entity.setLoaiCoSo("Sửa chữa");
        entity.setNguoiTao("test");

        assertEquals("ABC", entity.getTenCoSo());
        assertEquals("Hà Nội", entity.getDiaChi());
        assertEquals("Hà Nội", entity.getTinhThanh());
        assertEquals("Sửa chữa", entity.getLoaiCoSo());
        assertEquals("test", entity.getNguoiTao());
    }

    @Test
    void testAllArgsConstructor() {
        CoSuaChuaDongTau entity = new CoSuaChuaDongTau(
                1L, "ABC", "Hà Nội", "Hà Nội", "0123456789", "test@test.com",
                "Sửa chữa", "Khả năng 100", "Bộ Quốc phòng", "APPROVED",
                true, "admin1", LocalDateTime.now(),
                true, "director", LocalDateTime.now(),
                null, "user1", LocalDateTime.now(),
                LocalDateTime.now(), "admin", false,
                new java.util.ArrayList<>()
        );

        assertEquals(1L, entity.getId());
        assertEquals("ABC", entity.getTenCoSo());
        assertTrue(entity.getPheDuyetC1());
        assertTrue(entity.getPheDuyetC2());
        assertFalse(entity.getIsDeleted());
    }

    @Test
    void testAllArgsConstructor_ListType() {
        java.util.List<CoSuaChuaDongTauAttachment> emptyList = new java.util.ArrayList<>();
        CoSuaChuaDongTau entity = new CoSuaChuaDongTau(
                1L, "ABC", "Hà Nội", "Hà Nội", "0123456789", "test@test.com",
                "Sửa chữa", "Khả năng 100", "Bộ Quốc phòng", "APPROVED",
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
        CoSuaChuaDongTau a = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        CoSuaChuaDongTau b = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void testToString() {
        CoSuaChuaDongTau entity = CoSuaChuaDongTau.builder()
                .tenCoSo("ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .nguoiTao("test")
                .build();

        String str = entity.toString();
        assertNotNull(str);
        assertTrue(str.contains("ABC"));
        assertTrue(str.contains("Hà Nội"));
    }
}
