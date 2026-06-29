package com.hanghai.kchtg.cangben.dto.vungnuoc;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateVungNuocRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String tenVungNuoc;
    private UUID cangBienId;
    private BigDecimal dienTich;
    private BigDecimal doSauMax;
    private BigDecimal doSauTrungBinh;
    private String loaiVungNuoc;
    private String trangThaiHoatDong;
}
