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

    private Integer soLuong;

    private LocalDate ngayGhiNhan;

    private String gioDien;

    private String taiTrong;

    private String dienTichDangBo;

    private String ghiChu;
    private java.util.UUID donViId;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
