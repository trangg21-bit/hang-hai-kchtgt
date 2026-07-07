package com.hanghai.kchtg.cangben.dto.caucang;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateCauCangRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String tenCau;
    private UUID benCangId;
    private BigDecimal chieuDai;
    private BigDecimal taiTrong;
    private String loaiCau;
    private String trangThaiHoatDong;
}
