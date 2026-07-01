package com.hanghai.kchtg.luonghanghai.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * Update request for LuongHangHai (F-038). All fields optional.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuongHangHaiUpdateRequest {

    private String loaiTau;

    private Integer soLuong;

    private LocalDate ngayGhiNhan;

    private String gioDien;

    private String taiTrong;

    private String dienTichDangBo;

    private String ghiChu;
}
