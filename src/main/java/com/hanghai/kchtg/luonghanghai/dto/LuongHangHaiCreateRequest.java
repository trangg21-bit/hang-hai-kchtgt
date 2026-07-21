package com.hanghai.kchtg.luonghanghai.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

/**
 * Create request for LuongHangHai (F-038).
 */
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.NotBlank;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuongHangHaiCreateRequest {
    @NotBlank(message = "tên không được để trống")
    private String ten;
    private String maLuongHangHai;
    private Integer soLuongTram;
    private LocalDate thoiDiemSuaChuaTramGanNhat;
    private java.math.BigDecimal dienTichTram;
    private String ghiChu;
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
