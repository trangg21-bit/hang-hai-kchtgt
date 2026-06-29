package com.hanghai.kchtg.vanban.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Request DTO for recording KetQuaBaoTri.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaBaoTriRequest {

    @NotNull(message = "keHoachId không được để trống")
    private Long keHoachId;

    private LocalDateTime thoiGianBatDauThucTe;
    private LocalDateTime thoiGianKetThucThucTe;
    private String moTaKetQua;
    private String phuTonThayThe;
    private Long thoiGianNgungHoatDong;
    private String nguoiGhiNhan;
    private LocalDate ngayGhiNhan;
}
