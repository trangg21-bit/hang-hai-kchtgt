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
    @jakarta.validation.constraints.Pattern(regexp = "^(HIEN_HANH|TAM_NGUNG)$", message = "Trạng thái hoạt động không hợp lệ. Chỉ chấp nhận HIEN_HANH hoặc TAM_NGUNG")
    private String trangThaiHoatDong;
}
