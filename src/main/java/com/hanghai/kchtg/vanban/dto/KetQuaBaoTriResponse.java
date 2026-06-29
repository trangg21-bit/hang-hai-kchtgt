package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for KetQuaBaoTri.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaBaoTriResponse {

    private Long id;
    private Long keHoachId;
    private LocalDateTime thoiGianBatDauThucTe;
    private LocalDateTime thoiGianKetThucThucTe;
    private String moTaKetQua;
    private String phuTonThayThe;
    private Long thoiGianNgungHoatDong;
    private String nguoiGhiNhan;
    private LocalDate ngayGhiNhan;
}
