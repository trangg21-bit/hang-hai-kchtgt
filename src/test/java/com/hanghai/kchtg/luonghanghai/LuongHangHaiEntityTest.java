package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.luonghanghai.entity.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

class LuongHangHaiEntityTest {

    @Test
    void builder_shouldCreateValidEntity() {
        LuongHangHai entity = LuongHangHai.builder()
                .id(1L)
                .tenLuongHangHai("Tau test")
                .soHieu("HH-001")
                .thoiGianDuKien(LocalDate.of(2026, 1, 1))
                .donViQuanLy("Cuc Quang bao")
                .diaChi("Ha Noi")
                .tinhTrang(TinhTrang.HOAT_DONG)
                .trangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED)
                .nguoiTao("Admin")
                .build();

        assertThat(entity.getId()).isEqualTo(1L);
        assertThat(entity.getTenLuongHangHai()).isEqualTo("Tau test");
        assertThat(entity.getSoHieu()).isEqualTo("HH-001");
        assertThat(entity.getTinhTrang()).isEqualTo(TinhTrang.HOAT_DONG);
        assertThat(entity.getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.PROPOSED);
    }

    @Test
    void lombok_getterSetter_shouldWork() {
        LuongHangHai entity = new LuongHangHai();

        entity.setId(42L);
        entity.setTenLuongHangHai("Tau setter");
        entity.setSoHieu("HH-042");
        entity.setDonViQuanLy("Don vi quan ly test");
        entity.setDiaChi("Dia chi test");
        entity.setTinhTrang(TinhTrang.DA_XAY_DUNG);
        entity.setTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED);
        entity.setNguoiTao("Nguoi tao test");
        entity.setNguoiSuaDoi("Nguoi sua do test");

        assertThat(entity.getId()).isEqualTo(42L);
        assertThat(entity.getTenLuongHangHai()).isEqualTo("Tau setter");
        assertThat(entity.getSoHieu()).isEqualTo("HH-042");
        assertThat(entity.getDonViQuanLy()).isEqualTo("Don vi quan ly test");
        assertThat(entity.getDiaChi()).isEqualTo("Dia chi test");
        assertThat(entity.getTinhTrang()).isEqualTo(TinhTrang.DA_XAY_DUNG);
        assertThat(entity.getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.APPROVED);
        assertThat(entity.getNguoiTao()).isEqualTo("Nguoi tao test");
        assertThat(entity.getNguoiSuaDoi()).isEqualTo("Nguoi sua do test");
    }

    @Test
    void prePersist_shouldSetNgayTao() {
        LuongHangHai entity = LuongHangHai.builder()
                .tenLuongHangHai("Tau pre persist")
                .build();

        assertThat(entity.getNgayTao()).isNull();

        entity.onCreate();

        assertThat(entity.getNgayTao()).isNotNull();
        assertThat(entity.getNgayTao()).isInstanceOf(LocalDateTime.class);
    }

    @Test
    void preUpdate_shouldSetNgaySuaDoi() {
        LocalDateTime before = LocalDateTime.now().minusHours(1);
        LuongHangHai entity = LuongHangHai.builder()
                .tenLuongHangHai("Tau pre update")
                .ngaySuaDoi(before)
                .build();

        entity.onUpdate();

        assertThat(entity.getNgaySuaDoi()).isNotNull();
        assertThat(entity.getNgaySuaDoi()).isAfter(before);
    }

    @Test
    void attachments_shouldSupportOneToMany() {
        LuongHangHai entity = LuongHangHai.builder()
                .tenLuongHangHai("Tau attachment test")
                .build();

        LuongHangHaiAttachment attachment1 = LuongHangHaiAttachment.builder()
                .tenTaiLieu("Tai lieu 1")
                .duongDan("/files/1.pdf")
                .kichThuoc(1024L)
                .build();

        LuongHangHaiAttachment attachment2 = LuongHangHaiAttachment.builder()
                .tenTaiLieu("Tai lieu 2")
                .duongDan("/files/2.pdf")
                .kichThuoc(2048L)
                .build();

        entity.setAttachments(new ArrayList<>());
        entity.getAttachments().add(attachment1);
        entity.getAttachments().add(attachment2);

        assertThat(entity.getAttachments()).hasSize(2);
        assertThat(entity.getAttachments().get(0).getTenTaiLieu()).isEqualTo("Tai lieu 1");
    }

    @Test
    void tinhTrang_enum_shouldHaveAllValues() {
        assertThat(TinhTrang.values()).hasSize(5);
        assertThat(TinhTrang.HOAT_DONG).isNotNull();
        assertThat(TinhTrang.DA_XAY_DUNG).isNotNull();
        assertThat(TinhTrang.DANG_XAY_DUNG).isNotNull();
        assertThat(TinhTrang.TAM_DUNG).isNotNull();
        assertThat(TinhTrang.DA_HUY).isNotNull();
    }

    @Test
    void trangThaiPheDuyet_enum_shouldHaveAllValues() {
        assertThat(TrangThaiPheDuyet.values()).hasSize(4);
        assertThat(TrangThaiPheDuyet.PROPOSED).isNotNull();
        assertThat(TrangThaiPheDuyet.UNDER_REVIEW).isNotNull();
        assertThat(TrangThaiPheDuyet.APPROVED).isNotNull();
        assertThat(TrangThaiPheDuyet.REJECTED).isNotNull();
    }

    @Test
    void approvalHistory_shouldSupportOneToMany() {
        LuongHangHai entity = LuongHangHai.builder()
                .tenLuongHangHai("Tau history test")
                .build();

        entity.setApprovalHistory(new ArrayList<>());
        assertThat(entity.getApprovalHistory()).isEmpty();
    }

    @Test
    void pheDuyetLichSu_shouldSetFields() {
        LuongHangHai parent = LuongHangHai.builder()
                .id(1L)
                .build();

        PheDuyetLichSu history = PheDuyetLichSu.builder()
                .luongHangHai(parent)
                .capPheDuyet(1)
                .trangThai("APPROVED")
                .nguoiPheDuyet("Truong Phong")
                .ngayPheDuyet(LocalDate.of(2026, 6, 1))
                .lyDo("Phe duyet cap 1")
                .build();

        assertThat(history.getCapPheDuyet()).isEqualTo(1);
        assertThat(history.getTrangThai()).isEqualTo("APPROVED");
        assertThat(history.getNguoiPheDuyet()).isEqualTo("Truong Phong");
        assertThat(history.getNgayPheDuyet()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(history.getLyDo()).isEqualTo("Phe duyet cap 1");
    }

    @Test
    void attachment_shouldSetFields() {
        LuongHangHaiAttachment attachment = LuongHangHaiAttachment.builder()
                .id(1L)
                .tenTaiLieu("Bao cao")
                .duongDan("/uploads/bao-cao.pdf")
                .kichThuoc(5120L)
                .ngayTaiLen(LocalDate.of(2026, 6, 15))
                .build();

        assertThat(attachment.getId()).isEqualTo(1L);
        assertThat(attachment.getTenTaiLieu()).isEqualTo("Bao cao");
        assertThat(attachment.getDuongDan()).isEqualTo("/uploads/bao-cao.pdf");
        assertThat(attachment.getKichThuoc()).isEqualTo(5120L);
        assertThat(attachment.getNgayTaiLen()).isEqualTo(LocalDate.of(2026, 6, 15));
    }
}
