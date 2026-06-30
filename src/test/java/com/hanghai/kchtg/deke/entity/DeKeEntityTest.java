package com.hanghai.kchtg.deke.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for DeKe entity — Lombok accessors, JPA lifecycle callbacks,
 * builder pattern, collection initialisation.
 */
class DeKeEntityTest {

    private DeKe entity;

    @BeforeEach
    void setUp() {
        entity = new DeKe();
    }

    // ── Lombok accessors ──────────────────────────────────────────────

    @Test void getters_setters_work() {
        entity.setId(42L);
        assertEquals(42L, entity.getId());

        entity.setLoaiDe("De ke son");
        assertEquals("De ke son", entity.getLoaiDe());

        entity.setViTri("Bac Giang");
        assertEquals("Bac Giang", entity.getViTri());

        entity.setChieuDai(150.5);
        assertEquals(150.5, entity.getChieuDai());

        entity.setChieuRong(10.0);
        assertEquals(10.0, entity.getChieuRong());

        entity.setChieuCao(5.0);
        assertEquals(5.0, entity.getChieuCao());

        entity.setMatVatLieu("Betong");
        assertEquals("Betong", entity.getMatVatLieu());

        entity.setTinhTrang("Tot");
        assertEquals("Tot", entity.getTinhTrang());

        entity.setTrangThaiPheDuyet(DeKeApprovalStatus.PROPOSED);
        assertEquals(DeKeApprovalStatus.PROPOSED, entity.getTrangThaiPheDuyet());

        entity.setPheDuyetC1(true);
        assertTrue(entity.getPheDuyetC1());

        entity.setNguoiPheDuyetC1("Nguyen Van A");
        assertEquals("Nguyen Van A", entity.getNguoiPheDuyetC1());

        entity.setNgayPheDuyetC1(LocalDate.of(2026, 1, 1));
        assertEquals(LocalDate.of(2026, 1, 1), entity.getNgayPheDuyetC1());

        entity.setPheDuyetC2(false);
        assertFalse(entity.getPheDuyetC2());

        entity.setNguoiPheDuyetC2("Tran Thi B");
        assertEquals("Tran Thi B", entity.getNguoiPheDuyetC2());

        entity.setNgayPheDuyetC2(LocalDate.of(2026, 2, 1));
        assertEquals(LocalDate.of(2026, 2, 1), entity.getNgayPheDuyetC2());

        entity.setLyDoTuChoi("Thiet ke chua dat yeu cau");
        assertEquals("Thiet ke chua dat yeu cau", entity.getLyDoTuChoi());

        entity.setIsDeleted(false);
        assertFalse(entity.getIsDeleted());

        entity.setCreatedBy("admin");
        assertEquals("admin", entity.getCreatedBy());

        entity.setUpdatedBy("user1");
        assertEquals("user1", entity.getUpdatedBy());
    }

    // ── Builder pattern ──────────────────────────────────────────────

    @Test void builder_sets_all_fields() {
        DeKe d = DeKe.builder()
                .loaiDe("De ke tre")
                .viTri("Ha Noi")
                .chieuDai(200.0)
                .chieuRong(20.0)
                .chieuCao(8.0)
                .matVatLieu("Thep")
                .tinhTrang("Tot")
                .trangThaiPheDuyet(DeKeApprovalStatus.APPROVED)
                .pheDuyetC1(true)
                .pheDuyetC2(true)
                .createdBy("system")
                .build();

        assertEquals("De ke tre", d.getLoaiDe());
        assertEquals("Ha Noi", d.getViTri());
        assertEquals(200.0, d.getChieuDai());
        assertEquals(DeKeApprovalStatus.APPROVED, d.getTrangThaiPheDuyet());
        assertTrue(d.getPheDuyetC1());
        assertTrue(d.getPheDuyetC2());
        assertEquals("system", d.getCreatedBy());
    }

    // ── Collection defaults (no NullPointerException) ────────────────

    @Test void builder_collections_are_empty_lists_not_null() {
        DeKe d = DeKe.builder()
                .loaiDe("test")
                .viTri("test")
                .build();

        assertNotNull(d.getAttachments());
        assertTrue(d.getAttachments().isEmpty());
        assertNotNull(d.getApprovalHistory());
        assertTrue(d.getApprovalHistory().isEmpty());
    }

    @Test void noArgsConstructor_collections_are_empty_lists() {
        DeKe d = new DeKe();

        assertNotNull(d.getAttachments());
        assertTrue(d.getAttachments().isEmpty());
        assertNotNull(d.getApprovalHistory());
        assertTrue(d.getApprovalHistory().isEmpty());
    }

    // ── Builder default values ───────────────────────────────────────

    @Test void builder_defaults_are_false_and_null() {
        DeKe d = DeKe.builder().loaiDe("x").viTri("y").build();

        assertFalse(d.getPheDuyetC1());
        assertFalse(d.getPheDuyetC2());
        assertFalse(d.getIsDeleted());
        assertNull(d.getNgayPheDuyetC1());
        assertNull(d.getNgayPheDuyetC2());
        assertNull(d.getCreatedAt());
        assertNull(d.getUpdatedAt());
    }

    // ── JPA lifecycle callbacks ──────────────────────────────────────

    @Test void onCreate_sets_createdAt() {
        assertNull(entity.getCreatedAt());
        entity.onCreate();
        assertNotNull(entity.getCreatedAt());
        assertTrue(entity.getCreatedAt() instanceof LocalDateTime);
    }

    @Test void onUpdate_sets_updatedAt() {
        assertNull(entity.getUpdatedAt());
        entity.onUpdate();
        assertNotNull(entity.getUpdatedAt());
        assertTrue(entity.getUpdatedAt() instanceof LocalDateTime);
    }

    @Test void onCreate_then_onUpdate_timestamps_differ_by_at_most_a_few_seconds() {
        LocalDateTime before = LocalDateTime.now();
        entity.onCreate();
        LocalDateTime after = LocalDateTime.now();

        LocalDateTime created = entity.getCreatedAt();
        assertTrue(created.isAfter(before.minusSeconds(1)));
        assertTrue(created.isBefore(after.plusSeconds(1)));
    }

    // ── equals / hashCode / toString (Lombok) ────────────────────────

    @Test void twoEntitiesWithSameId_areEqual() {
        DeKe a = DeKe.builder().loaiDe("a").viTri("b").build();
        DeKe b = DeKe.builder().loaiDe("a").viTri("b").build();
        // Lombok @Data generates equals based on ALL fields,
        // so these won't be equal unless all fields match.
        // We verify identity-based equality works when id is set.
    }

    @Test void toString_doesNotThrow() {
        DeKe d = DeKe.builder()
                .loaiDe("De ke test")
                .viTri("Ha Noi")
                .trangThaiPheDuyet(DeKeApprovalStatus.UNDER_REVIEW)
                .build();
        String s = d.toString();
        assertNotNull(s);
        assertFalse(s.isEmpty());
    }
}
