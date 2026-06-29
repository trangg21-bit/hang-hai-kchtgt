package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.TinhTrangVanHanh;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO for creating a KeHoachVanHanh record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeHoachVanHanhCreateRequest {

    private LocalDate ngayVanHanh;
    private String cauCang;
    private String thietBi;
    private LocalTime thoiGianBatDau;
    private LocalTime thoiGianKetThuc;
    private TinhTrangVanHanh tinhTrang;
    private String nguoiTao;
}
