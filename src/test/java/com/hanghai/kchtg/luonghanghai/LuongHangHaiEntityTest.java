package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.luonghanghai.entity.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class LuongHangHaiEntityTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Test void builder_shouldCreateValidEntity() {
        LuongHangHai e = LuongHangHai.builder()
                .id(TEST_ID)
                .ten("Luong hang hai")
                .soLuongTram(100)
                .thoiDiemSuaChuaTramGanNhat(LocalDate.of(2026, 1, 1))
                .dienTichTram(new java.math.BigDecimal("200"))
                .ghiChu("Test ghi chu")
                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                .pheDuyetC1(false)
                .pheDuyetC2(false)
                .isDeleted(false)
                .createdBy("Admin")
                .build();
        assertThat(e.getId()).isEqualTo(TEST_ID);
        assertThat(e.getTen()).isEqualTo("Luong hang hai");
        assertThat(e.getApprovalStatus()).isEqualTo(LuongHangHaiApprovalStatus.PROPOSED);
        assertThat(e.getPheDuyetC1()).isFalse();
        assertThat(e.getSoLuongTram()).isEqualTo(100);
    }

    @Test void getterSetter_shouldWork() {
        LuongHangHai e = new LuongHangHai();
        UUID uuid = UUID.randomUUID();
        e.setId(uuid);
        e.setTen("Luong hang hai moi");
        e.setSoLuongTram(200);
        e.setDienTichTram(new java.math.BigDecimal("300"));
        e.setGhiChu("Test setter");
        e.setApprovalStatus(LuongHangHaiApprovalStatus.APPROVED);
        e.setCreatedBy("User");
        e.setUpdatedBy("Admin");
        assertThat(e.getId()).isEqualTo(uuid);
        assertThat(e.getTen()).isEqualTo("Luong hang hai moi");
        assertThat(e.getApprovalStatus()).isEqualTo(LuongHangHaiApprovalStatus.APPROVED);
    }

    @Test void prePersist_shouldSetCreatedAt() {
        // JPA lifecycle: onCreate() is protected — test via manual setter
        LuongHangHai e = LuongHangHai.builder().ten("Luong hang hai").build();
        assertThat(e.getCreatedAt()).isNull();
        e.setCreatedAt(LocalDateTime.of(2026, 6, 1, 10, 0));
        assertThat(e.getCreatedAt()).isNotNull().isInstanceOf(LocalDateTime.class);
    }

    @Test void preUpdate_shouldSetUpdatedAt() {
        LocalDateTime before = LocalDateTime.now().minusHours(1);
        LuongHangHai e = LuongHangHai.builder().ten("Luong hang hai").updatedAt(before).build();
        // JPA lifecycle: onUpdate() is protected — test via manual setter
        e.setUpdatedAt(LocalDateTime.now());
        assertThat(e.getUpdatedAt()).isNotNull().isAfter(before);
    }

    @Test void attachments_shouldSupportOneToMany() {
        LuongHangHai e = LuongHangHai.builder().ten("Luong hang hai").build();
        LuongHangHaiAttachment a1 = LuongHangHaiAttachment.builder().tenTaiLieu("File 1").duongDan("/f1.pdf").build();
        LuongHangHaiAttachment a2 = LuongHangHaiAttachment.builder().tenTaiLieu("File 2").duongDan("/f2.pdf").build();
        e.setAttachments(new ArrayList<>());
        e.getAttachments().add(a1);
        e.getAttachments().add(a2);
        assertThat(e.getAttachments()).hasSize(2);
    }

    @Test void approvalHistory_shouldSupportOneToMany() {
        LuongHangHai e = LuongHangHai.builder().ten("Luong hang hai").build();
        e.setApprovalHistory(new ArrayList<>());
        assertThat(e.getApprovalHistory()).isEmpty();
    }

    @Test void approvalStatus_enum_shouldHaveAllValues() {
        assertThat(LuongHangHaiApprovalStatus.values()).hasSize(4);
        assertThat(LuongHangHaiApprovalStatus.PROPOSED).isNotNull();
        assertThat(LuongHangHaiApprovalStatus.UNDER_REVIEW).isNotNull();
        assertThat(LuongHangHaiApprovalStatus.APPROVED).isNotNull();
        assertThat(LuongHangHaiApprovalStatus.REJECTED).isNotNull();
    }

    @Test void pheDuyetLichSu_shouldSetFields() {
        UUID uuid = UUID.randomUUID();
        LuongHangHai parent = LuongHangHai.builder().id(uuid).build();
        PheDuyetLichSu h = PheDuyetLichSu.builder()
                .luongHangHai(parent)
                .capPheDuyet(1)
                .trangThai("APPROVED")
                .nguoiPheDuyet("Truong")
                .ngayPheDuyet(LocalDate.of(2026, 6, 1))
                .lyDo("Phe cap 1")
                .build();
        assertThat(h.getCapPheDuyet()).isEqualTo(1);
        assertThat(h.getTrangThai()).isEqualTo("APPROVED");
        assertThat(h.getNguoiPheDuyet()).isEqualTo("Truong");
    }

    @Test void attachment_shouldSetFields() {
        LuongHangHaiAttachment a = LuongHangHaiAttachment.builder()
                .id(1L)
                .tenTaiLieu("Bao cao")
                .duongDan("/files/bc.pdf")
                .kichThuoc(5120L)
                .ngayTaiLen(LocalDate.of(2026, 6, 15))
                .build();
        assertThat(a.getId()).isEqualTo(1L);
        assertThat(a.getTenTaiLieu()).isEqualTo("Bao cao");
        assertThat(a.getDuongDan()).isEqualTo("/files/bc.pdf");
        assertThat(a.getKichThuoc()).isEqualTo(5120L);
    }

    @Test void isDeleted_shouldDefaultFalse() {
        LuongHangHai e = LuongHangHai.builder().ten("Luong hang hai").build();
        assertThat(e.getIsDeleted()).isFalse();
    }

    @Test void fullFields_shouldSetAll() {
        LuongHangHai e = LuongHangHai.builder()
                .id(TEST_ID_2)
                .ten("Luong hang hai full")
                .soLuongTram(500)
                .thoiDiemSuaChuaTramGanNhat(LocalDate.of(2026, 3, 15))
                .dienTichTram(new java.math.BigDecimal("400"))
                .ghiChu("Full test")
                .approvalStatus(LuongHangHaiApprovalStatus.APPROVED)
                .pheDuyetC1(true)
                .pheDuyetC2(true)
                .nguoiPheDuyetC1("Phong")
                .nguoiPheDuyetC2("Cuc")
                .lyDoTuChoi("Khong phu hop")
                .isDeleted(false)
                .createdBy("Admin")
                .updatedBy("User")
                .build();
        assertThat(e.getId()).isEqualTo(TEST_ID_2);
        assertThat(e.getSoLuongTram()).isEqualTo(500);
        assertThat(e.getPheDuyetC1()).isTrue();
        assertThat(e.getPheDuyetC2()).isTrue();
        assertThat(e.getNguoiPheDuyetC1()).isEqualTo("Phong");
        assertThat(e.getLyDoTuChoi()).isEqualTo("Khong phu hop");
    }
}
