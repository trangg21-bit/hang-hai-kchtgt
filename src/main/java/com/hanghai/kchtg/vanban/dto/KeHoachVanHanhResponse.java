package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.TinhTrangVanHanh;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Response DTO for KeHoachVanHanh.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeHoachVanHanhResponse {

    private Long id;
    private LocalDate ngayVanHanh;
    private String cauCang;
    private String thietBi;
    private LocalTime thoiGianBatDau;
    private LocalTime thoiGianKetThuc;
    private TinhTrangVanHanh tinhTrang;
    private String nguoiTao;
    private LocalDateTime ngayTao;
    private String nguoiSuaDoi;
    private LocalDateTime ngaySuaDoi;
    private List<VanHanhChiTietResponse> vanHanhChiTiet;
}
