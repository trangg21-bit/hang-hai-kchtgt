package com.hanghai.kchtg.vanban.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaoCaoBaoTriCreateRequest {

    @NotNull
    private String loaiBaoCao;

    @NotNull
    private LocalDate kyBatDau;

    @NotNull
    private LocalDate kyKetThuc;

    private BigDecimal tongChiPhi;

    private String duongDanFile;

    private String nguoiTao;
}
