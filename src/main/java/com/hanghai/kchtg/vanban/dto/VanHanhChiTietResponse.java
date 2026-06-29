package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for VanHanhChiTiet.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VanHanhChiTietResponse {

    private Long id;
    private String moTa;
    private BigDecimal sanLuongDuKien;
    private BigDecimal sanLuongThucTe;
    private String ghiChu;
}
