package com.hanghai.kchtg.luonghanghai.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * Update request for LuongHangHai (F-038). All fields optional.
 */
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuongHangHaiUpdateRequest {

    private String ten;

    private Integer soLuongTram;

    private LocalDate thoiDiemSuaChuaTramGanNhat;

    private java.math.BigDecimal dienTichTram;

    private String ghiChu;

    private String maLuongHangHai;

    private java.util.UUID cangBienId;

    private java.util.UUID donViVanHanhId;

    private String diaDiem;

    private String diaDiemChiTiet;

    private String tramQuanLyLuong;

    private Integer soLuongNhanSuTaiTram;

    private Integer namBaoTriGanNhat;

    private java.math.BigDecimal khoiLuongNaoVet;

    @Builder.Default private Integer soLuongPhao = 0;

    @Builder.Default private Integer soLuongTieu = 0;

    @Builder.Default private Integer tinhTrang = 1;

    private java.util.UUID donViId;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
