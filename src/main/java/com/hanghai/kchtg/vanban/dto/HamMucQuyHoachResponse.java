package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for HamMucQuyHoach.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HamMucQuyHoachResponse {

    private Long id;
    private String tenHamMuc;
    private String donViTinh;
    private BigDecimal giaTriKeHoach;
    private BigDecimal giaTriThucTe;
    private String trangThai;
}
