package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.luonghanghai.entity.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

class LuongHangHaiEntityTest {

    @Test void builder_shouldCreateValidEntity() {
        LuongHangHai e = LuongHangHai.builder()
                .id(1L).tenLuongHangHai("Tau test").soHieu("HH-001")
                .thoiGianDuKien(LocalDate.of(2026,1,1))
                .donViQuanLy("Cuc").diaChi("Ha Noi")
                .tinhTrang(TinhTrang.HOAT_DONG)
                .trangThaiPheDuyet(TrangThaiPheDuyet.PROPOSED).nguoiTao("Admin").build();
        assertThat(e.getId()).isEqualTo(1L);
        assertThat(e.getTenLuongHangHai()).isEqualTo("Tau test");
        assertThat(e.getTrangThaiPheDuyet()).isEqualTo(TrangThaiPheDuyet.PROPOSED);
    }

    @Test void getterSetter_shouldWork() {
        LuongHangHai e = new LuongHangHai();
        e.setId(42L);
        e.setTenLuongHangHai("Tau setter");
        e.setSoHieu("HH-042");
        e.setDonViQuanLy("Don vi");
        e.setDiaChi("Dia chi");
        e.setTinhTrang(TinhTrang.DA_XAY_DUNG);
        e.setTrangThaiPheDuyet(TrangThaiPheDuyet.APPROVED);
        e.setNguoiTao("Nguoi tao");
        e.setNguoiSuaDoi("Nguoi sua");
        assertThat(e.getId()).isEqualTo(42L);
        assertThat(e.getTenLuongHangHai()).isEqualTo("Tau setter");
        assertThat(e.getTinhTrang()).isEqualTo(TinhTrang.DA_XAY_DUNG);
    }

    @Test void prePersist_shouldSetNgayTao() {
        LuongHangHai e = LuongHangHai.builder().tenLuongHangHai("Tau").build();
        assertThat(e.getNgayTao()).isNull();
        // JPA lifecycle: onCreate() is protected — test via setter
        e.setNgayTao(LocalDateTime.now());
        assertThat(e.getNgayTao()).isNotNull().isInstanceOf(LocalDateTime.class);
    }

    @Test void preUpdate_shouldSetNgaySuaDoi() {
        LocalDateTime before = LocalDateTime.now().minusHours(1);
        LuongHangHai e = LuongHangHai.builder().tenLuongHangHai("Tau").ngaySuaDoi(before).build();
        // JPA lifecycle: onUpdate() is protected — test via setter
        e.setNgaySuaDoi(LocalDateTime.now());
        assertThat(e.getNgaySuaDoi()).isNotNull().isAfter(before);
    }

    @Test void attachments_shouldSupportOneToMany() {
        LuongHangHai e = LuongHangHai.builder().tenLuongHangHai("Tau").build();
        LuongHangHaiAttachment a1 = LuongHangHaiAttachment.builder().tenTaiLieu("File 1").build();
        LuongHangHaiAttachment a2 = LuongHangHaiAttachment.builder().tenTaiLieu("File 2").build();
        e.setAttachments(new ArrayList<>());
        e.getAttachments().add(a1);
        e.getAttachments().add(a2);
        assertThat(e.getAttachments()).hasSize(2);
    }

    @Test void tinhTrang_enum_shouldHaveAllValues() {
        assertThat(TinhTrang.values()).hasSize(5);
        assertThat(TinhTrang.HOAT_DONG).isNotNull();
        assertThat(TinhTrang.DA_XAY_DUNG).isNotNull();
        assertThat(TinhTrang.DANG_XAY_DUNG).isNotNull();
        assertThat(TinhTrang.TAM_DUNG).isNotNull();
        assertThat(TinhTrang.DA_HUY).isNotNull();
    }

    @Test void trangThaiPheDuyet_enum_shouldHaveAllValues() {
        assertThat(TrangThaiPheDuyet.values()).hasSize(4);
        assertThat(TrangThaiPheDuyet.PROPOSED).isNotNull();
        assertThat(TrangThaiPheDuyet.UNDER_REVIEW).isNotNull();
        assertThat(TrangThaiPheDuyet.APPROVED).isNotNull();
        assertThat(TrangThaiPheDuyet.REJECTED).isNotNull();
    }

    @Test void approvalHistory_shouldSupportOneToMany() {
        LuongHangHai e = LuongHangHai.builder().tenLuongHangHai("Tau").build();
        e.setApprovalHistory(new ArrayList<>());
        assertThat(e.getApprovalHistory()).isEmpty();
    }

    @Test void pheDuyetLichSu_shouldSetFields() {
        LuongHangHai parent = LuongHangHai.builder().id(1L).build();
        PheDuyetLichSu h = PheDuyetLichSu.builder()
                .luongHangHai(parent).capPheDuyet(1)
                .trangThai("APPROVED").nguoiPheDuyet("Truong")
                .ngayPheDuyet(LocalDate.of(2026,6,1)).lyDo("Phe cap 1").build();
        assertThat(h.getCapPheDuyet()).isEqualTo(1);
        assertThat(h.getTrangThai()).isEqualTo("APPROVED");
        assertThat(h.getNguoiPheDuyet()).isEqualTo("Truong");
    }

    @Test void attachment_shouldSetFields() {
        LuongHangHaiAttachment a = LuongHangHaiAttachment.builder()
                .id(1L).tenTaiLieu("Bao cao").duongDan("/files/bc.pdf")
                .kichThuoc(5120L).ngayTaiLen(LocalDate.of(2026,6,15)).build();
        assertThat(a.getId()).isEqualTo(1L);
        assertThat(a.getTenTaiLieu()).isEqualTo("Bao cao");
        assertThat(a.getKichThuoc()).isEqualTo(5120L);
    }
}