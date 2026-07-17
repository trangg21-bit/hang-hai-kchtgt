package com.hanghai.kchtg.luonghanghai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

/**
 * Create request for LuongHangHai (F-038).
 */
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuongHangHaiCreateRequest {
    @NotBlank(message = "Ten luong hang hai khong duoc de trong") private String ten;
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
