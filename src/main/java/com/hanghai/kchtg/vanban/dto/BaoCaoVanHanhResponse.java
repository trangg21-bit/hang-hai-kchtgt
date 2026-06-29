package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaoCaoVanHanhResponse {

    private Long id;
    private String loaiBaoCao;
    private LocalDate kyBatDau;
    private LocalDate kyKetThuc;
    private BigDecimal tongChiPhi;
    private String duongDanFile;
    private String nguoiTao;
    private LocalDateTime ngayTao;
}
